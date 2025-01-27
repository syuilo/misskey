import { mkdir, writeFile } from 'fs/promises';
import { OpenAPIV3_1 } from 'openapi-types';
import { toPascal } from 'ts-case-convert';
import OpenAPIParser from '@readme/openapi-parser';
import openapiTS from 'openapi-typescript';

async function generateBaseTypes(
	openApiDocs: OpenAPIV3_1.Document,
	openApiJsonPath: string,
	typeFileName: string,
) {
	const disabledLints = [
		'@typescript-eslint/naming-convention',
		'@typescript-eslint/no-explicit-any',
	];

	const lines: string[] = [];
	for (const lint of disabledLints) {
		lines.push(`/* eslint ${lint}: 0 */`);
	}
	lines.push('');

	const generatedTypes = await openapiTS(openApiJsonPath, {
		exportType: true,
		transform(schemaObject) {
			if ('format' in schemaObject && schemaObject.format === 'binary') {
				return schemaObject.nullable ? 'Blob | null' : 'Blob';
			}
		},
	});
	lines.push(generatedTypes);
	lines.push('');

	await writeFile(typeFileName, lines.join('\n'));
}

async function generateSchemaEntities(
	openApiDocs: OpenAPIV3_1.Document,
	typeFileName: string,
	outputPath: string,
) {
	if (!openApiDocs.components?.schemas) {
		return;
	}

	const schemas = openApiDocs.components.schemas;
	const schemaNames = Object.keys(schemas);
	const typeAliasLines: string[] = [];

	typeAliasLines.push(`import { components } from '${toImportPath(typeFileName)}';`);
	typeAliasLines.push(
		...schemaNames.map(it => `export type ${it} = components['schemas']['${it}'];`),
	);
	typeAliasLines.push('');

	await writeFile(outputPath, typeAliasLines.join('\n'));
}

async function generateEndpoints(
	openApiDocs: OpenAPIV3_1.Document,
	typeFileName: string,
	entitiesOutputPath: string,
	endpointOutputPath: string,
) {
	const endpoints: Endpoint[] = [];
	const endpointReqMediaTypes: EndpointReqMediaType[] = [];
	const endpointReqMediaTypesSet = new Set<string>();

	// misskey-jsはPOST固定で送っているので、こちらも決め打ちする。別メソッドに対応することがあればこちらも直す必要あり
	const paths = openApiDocs.paths ?? {};
	const postPathItems = Object.keys(paths)
		.map(it => ({
			_path_: it.replace(/^\//, ''),
			...paths[it]?.post,
		}))
		.filter(filterUndefined);

	for (const operation of postPathItems) {
		const path = operation._path_;
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const operationId = operation.operationId!;
		const endpoint = new Endpoint(path);
		endpoints.push(endpoint);

		if (isRequestBodyObject(operation.requestBody)) {
			const reqContent = operation.requestBody.content;
			const supportMediaTypes = Object.keys(reqContent);
			if (supportMediaTypes.length > 0) {
				// いまのところ複数のメディアタイプをとるエンドポイントは無いので決め打ちする
				const req = new OperationTypeAlias(
					operationId,
					path,
					supportMediaTypes[0],
					OperationsAliasType.REQUEST,
				);
				endpoint.request = req;

				const reqType = new EndpointReqMediaType(path, req);
				if (reqType.getMediaType() !== 'application/json') {
					endpointReqMediaTypesSet.add(reqType.getMediaType());
					endpointReqMediaTypes.push(reqType);
				}
			}
		}

		if (operation.responses && isResponseObject(operation.responses['200']) && operation.responses['200'].content) {
			const resContent = operation.responses['200'].content;
			const supportMediaTypes = Object.keys(resContent);
			if (supportMediaTypes.length > 0) {
				// いまのところ複数のメディアタイプを返すエンドポイントは無いので決め打ちする
				endpoint.response = new OperationTypeAlias(
					operationId,
					path,
					supportMediaTypes[0],
					OperationsAliasType.RESPONSE,
				);
			}
		}
	}

	const entitiesOutputLine: string[] = [];

	entitiesOutputLine.push('/* eslint @typescript-eslint/naming-convention: 0 */');

	entitiesOutputLine.push(`import { operations } from '${toImportPath(typeFileName)}';`);
	entitiesOutputLine.push('');

	entitiesOutputLine.push(new EmptyTypeAlias(OperationsAliasType.REQUEST).toLine());
	entitiesOutputLine.push(new EmptyTypeAlias(OperationsAliasType.RESPONSE).toLine());
	entitiesOutputLine.push('');

	const entities = endpoints
		.flatMap(it => [it.request, it.response].filter(i => i))
		.filter(filterUndefined);
	entitiesOutputLine.push(...entities.map(it => it.toLine()));
	entitiesOutputLine.push('');

	await writeFile(entitiesOutputPath, entitiesOutputLine.join('\n'));

	const endpointOutputLine: string[] = [];

	endpointOutputLine.push('import type {');
	endpointOutputLine.push(
		...[emptyRequest, emptyResponse, ...entities].map(it => '\t' + it.generateName() + ','),
	);
	endpointOutputLine.push(`} from '${toImportPath(entitiesOutputPath)}';`);
	endpointOutputLine.push('');

	endpointOutputLine.push('export type Endpoints = {');
	endpointOutputLine.push(
		...endpoints.map(it => '\t' + it.toLine()),
	);
	endpointOutputLine.push('};');
	endpointOutputLine.push('');

	function generateEndpointReqMediaTypesType() {
		return `{ [K in keyof Endpoints]?: ${[...endpointReqMediaTypesSet].map((t) => `'${t}'`).join(' | ')}; }`;
	}

	endpointOutputLine.push(`/**
 * NOTE: The content-type for all endpoints not listed here is application/json.
 */`);
	endpointOutputLine.push('export const endpointReqTypes = {');

	endpointOutputLine.push(
		...endpointReqMediaTypes.map(it => '\t' + it.toLine()),
	);

	endpointOutputLine.push(`} as const satisfies ${generateEndpointReqMediaTypesType()};`);
	endpointOutputLine.push('');

	await writeFile(endpointOutputPath, endpointOutputLine.join('\n'));
}

async function generateApiClientJSDoc(
	openApiDocs: OpenAPIV3_1.Document,
	apiClientFileName: string,
	endpointsFileName: string,
	warningsOutputPath: string,
) {
	const endpoints: {
		operationId: string;
		path: string;
		description: string;
	}[] = [];

	// misskey-jsはPOST固定で送っているので、こちらも決め打ちする。別メソッドに対応することがあればこちらも直す必要あり
	const paths = openApiDocs.paths ?? {};
	const postPathItems = Object.keys(paths)
		.map(it => ({
			_path_: it.replace(/^\//, ''),
			...paths[it]?.post,
		}))
		.filter(filterUndefined);

	for (const operation of postPathItems) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const operationId = operation.operationId!;

		if (operation.description) {
			endpoints.push({
				operationId: operationId,
				path: operation._path_,
				description: operation.description,
			});
		}
	}

	const endpointOutputLine: string[] = [];

	endpointOutputLine.push(`import type { SwitchCaseResponseType } from '${toImportPath(apiClientFileName)}';`);
	endpointOutputLine.push(`import type { Endpoints } from '${toImportPath(endpointsFileName)}';`);
	endpointOutputLine.push('');

	endpointOutputLine.push(`declare module '${toImportPath(apiClientFileName)}' {`);
	endpointOutputLine.push('  export interface APIClient {');
	for (let i = 0; i < endpoints.length; i++) {
		const endpoint = endpoints[i];

		endpointOutputLine.push(
			'    /**',
			`     * ${endpoint.description.split('\n').join('\n     * ')}`,
			'     */',
			`    request<E extends '${endpoint.path}', P extends Endpoints[E][\'req\']>(`,
			'      endpoint: E,',
			'      params: P,',
			'      credential?: string | null,',
			'    ): Promise<SwitchCaseResponseType<E, P>>;',
		);

		if (i < endpoints.length - 1) {
			endpointOutputLine.push('\n');
		}
	}
	endpointOutputLine.push('  }');
	endpointOutputLine.push('}');
	endpointOutputLine.push('');

	await writeFile(warningsOutputPath, endpointOutputLine.join('\n'));
}

function isRequestBodyObject(value: unknown): value is OpenAPIV3_1.RequestBodyObject {
	if (!value) {
		return false;
	}

	const { content } = value as Record<keyof OpenAPIV3_1.RequestBodyObject, unknown>;
	return content !== undefined;
}

function isResponseObject(value: unknown): value is OpenAPIV3_1.ResponseObject {
	if (!value) {
		return false;
	}

	const { description } = value as Record<keyof OpenAPIV3_1.ResponseObject, unknown>;
	return description !== undefined;
}

function filterUndefined<T>(item: T): item is Exclude<T, undefined> {
	return item !== undefined;
}

function toImportPath(fileName: string, fromPath = '/built/autogen', toPath = ''): string {
	return fileName.replace(fromPath, toPath).replace('.ts', '.js');
}

enum OperationsAliasType {
	REQUEST = 'Request',
	RESPONSE = 'Response'
}

interface IOperationTypeAlias {
	readonly type: OperationsAliasType

	generateName(): string

	toLine(): string
}

class OperationTypeAlias implements IOperationTypeAlias {
	public readonly operationId: string;
	public readonly path: string;
	public readonly mediaType: string;
	public readonly type: OperationsAliasType;

	constructor(
		operationId: string,
		path: string,
		mediaType: string,
		type: OperationsAliasType,
	) {
		this.operationId = operationId;
		this.path = path;
		this.mediaType = mediaType;
		this.type = type;
	}

	generateName(): string {
		const nameBase = this.path.replace(/\//g, '-');
		return toPascal(nameBase + this.type);
	}

	toLine(): string {
		const name = this.generateName();
		return (this.type === OperationsAliasType.REQUEST)
			? `export type ${name} = operations['${this.operationId}']['requestBody']['content']['${this.mediaType}'];`
			: `export type ${name} = operations['${this.operationId}']['responses']['200']['content']['${this.mediaType}'];`;
	}
}

class EmptyTypeAlias implements IOperationTypeAlias {
	readonly type: OperationsAliasType;

	constructor(type: OperationsAliasType) {
		this.type = type;
	}

	generateName(): string {
		return 'Empty' + this.type;
	}

	toLine(): string {
		const name = this.generateName();
		return `export type ${name} = Record<string, unknown> | undefined;`;
	}
}

const emptyRequest = new EmptyTypeAlias(OperationsAliasType.REQUEST);
const emptyResponse = new EmptyTypeAlias(OperationsAliasType.RESPONSE);

class Endpoint {
	public readonly path: string;
	public request?: IOperationTypeAlias;
	public response?: IOperationTypeAlias;

	constructor(path: string) {
		this.path = path;
	}

	toLine(): string {
		const reqName = this.request?.generateName() ?? emptyRequest.generateName();
		const resName = this.response?.generateName() ?? emptyResponse.generateName();

		return `'${this.path}': { req: ${reqName}; res: ${resName} };`;
	}
}

class EndpointReqMediaType {
	public readonly path: string;
	public readonly mediaType: string;

	constructor(path: string, request: OperationTypeAlias, mediaType?: undefined);
	constructor(path: string, request: undefined, mediaType: string);
	constructor(path: string, request: OperationTypeAlias | undefined, mediaType?: string) {
		this.path = path;
		this.mediaType = mediaType ?? request?.mediaType ?? 'application/json';
	}

	getMediaType(): string {
		return this.mediaType;
	}

	toLine(): string {
		return `'${this.path}': '${this.mediaType}',`;
	}
}

async function main() {
	const generatePath = './built/autogen';
	await mkdir(generatePath, { recursive: true });

	const openApiJsonPath = './api.json';
	const openApiDocs = await OpenAPIParser.parse(openApiJsonPath) as OpenAPIV3_1.Document;

	const typeFileName = './built/autogen/types.ts';
	await generateBaseTypes(openApiDocs, openApiJsonPath, typeFileName);

	const modelFileName = `${generatePath}/models.ts`;
	await generateSchemaEntities(openApiDocs, typeFileName, modelFileName);

	const entitiesFileName = `${generatePath}/entities.ts`;
	const endpointFileName = `${generatePath}/endpoint.ts`;
	await generateEndpoints(openApiDocs, typeFileName, entitiesFileName, endpointFileName);

	const apiClientWarningFileName = `${generatePath}/apiClientJSDoc.ts`;
	await generateApiClientJSDoc(openApiDocs, '../api.ts', endpointFileName, apiClientWarningFileName);
}

main();
