export class ApiError extends Error {
	public message: string;
	public code: string;
	public id: string;
	public kind: string;
	public info?: any;

	constructor(e?: { message: string, code: string, id: string, kind: 'client' | 'server' }, info?: any) {
		if (e == null) e = {
			message: 'Internal error occured.',
			code: 'INTERNAL_ERROR',
			id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
			kind: 'server'
		};

		super(e.message);
		this.message = e.message;
		this.code = e.code;
		this.id = e.id;
		this.kind = e.kind;
		this.info = info;
	}
}
