/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Context, JsonLd } from 'jsonld/jsonld-spec.js';

/* eslint:disable:quotemark indent */
const id_v1 = {
	'@context': {
		'id': '@id',
		'type': '@type',

		'cred': 'https://w3id.org/credentials#',
		'dc': 'http://purl.org/dc/terms/',
		'identity': 'https://w3id.org/identity#',
		'perm': 'https://w3id.org/permissions#',
		'ps': 'https://w3id.org/payswarm#',
		'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
		'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
		'sec': 'https://w3id.org/security#',
		'schema': 'http://schema.org/',
		'xsd': 'http://www.w3.org/2001/XMLSchema#',

		'Group': 'https://www.w3.org/ns/activitystreams#Group',

		'claim': { '@id': 'cred:claim', '@type': '@id' },
		'credential': { '@id': 'cred:credential', '@type': '@id' },
		'issued': { '@id': 'cred:issued', '@type': 'xsd:dateTime' },
		'issuer': { '@id': 'cred:issuer', '@type': '@id' },
		'recipient': { '@id': 'cred:recipient', '@type': '@id' },
		'Credential': 'cred:Credential',
		'CryptographicKeyCredential': 'cred:CryptographicKeyCredential',

		'about': { '@id': 'schema:about', '@type': '@id' },
		'address': { '@id': 'schema:address', '@type': '@id' },
		'addressCountry': 'schema:addressCountry',
		'addressLocality': 'schema:addressLocality',
		'addressRegion': 'schema:addressRegion',
		'comment': 'rdfs:comment',
		'created': { '@id': 'dc:created', '@type': 'xsd:dateTime' },
		'creator': { '@id': 'dc:creator', '@type': '@id' },
		'description': 'schema:description',
		'email': 'schema:email',
		'familyName': 'schema:familyName',
		'givenName': 'schema:givenName',
		'image': { '@id': 'schema:image', '@type': '@id' },
		'label': 'rdfs:label',
		'name': 'schema:name',
		'postalCode': 'schema:postalCode',
		'streetAddress': 'schema:streetAddress',
		'title': 'dc:title',
		'url': { '@id': 'schema:url', '@type': '@id' },
		'Person': 'schema:Person',
		'PostalAddress': 'schema:PostalAddress',
		'Organization': 'schema:Organization',

		'identityService': { '@id': 'identity:identityService', '@type': '@id' },
		'idp': { '@id': 'identity:idp', '@type': '@id' },
		'Identity': 'identity:Identity',

		'paymentProcessor': 'ps:processor',
		'preferences': { '@id': 'ps:preferences', '@type': '@vocab' },

		'cipherAlgorithm': 'sec:cipherAlgorithm',
		'cipherData': 'sec:cipherData',
		'cipherKey': 'sec:cipherKey',
		'digestAlgorithm': 'sec:digestAlgorithm',
		'digestValue': 'sec:digestValue',
		'domain': 'sec:domain',
		'expires': { '@id': 'sec:expiration', '@type': 'xsd:dateTime' },
		'initializationVector': 'sec:initializationVector',
		'member': { '@id': 'schema:member', '@type': '@id' },
		'memberOf': { '@id': 'schema:memberOf', '@type': '@id' },
		'nonce': 'sec:nonce',
		'normalizationAlgorithm': 'sec:normalizationAlgorithm',
		'owner': { '@id': 'sec:owner', '@type': '@id' },
		'password': 'sec:password',
		'privateKey': { '@id': 'sec:privateKey', '@type': '@id' },
		'privateKeyPem': 'sec:privateKeyPem',
		'publicKey': { '@id': 'sec:publicKey', '@type': '@id' },
		'publicKeyPem': 'sec:publicKeyPem',
		'publicKeyService': { '@id': 'sec:publicKeyService', '@type': '@id' },
		'revoked': { '@id': 'sec:revoked', '@type': 'xsd:dateTime' },
		'signature': 'sec:signature',
		'signatureAlgorithm': 'sec:signatureAlgorithm',
		'signatureValue': 'sec:signatureValue',
		'CryptographicKey': 'sec:Key',
		'EncryptedMessage': 'sec:EncryptedMessage',
		'GraphSignature2012': 'sec:GraphSignature2012',
		'LinkedDataSignature2015': 'sec:LinkedDataSignature2015',

		'accessControl': { '@id': 'perm:accessControl', '@type': '@id' },
		'writePermission': { '@id': 'perm:writePermission', '@type': '@id' },
	},
} satisfies JsonLd;

const security_v1 = {
	'@context': {
		'id': '@id',
		'type': '@type',

		'dc': 'http://purl.org/dc/terms/',
		'sec': 'https://w3id.org/security#',
		'xsd': 'http://www.w3.org/2001/XMLSchema#',

		'EcdsaKoblitzSignature2016': 'sec:EcdsaKoblitzSignature2016',
		'Ed25519Signature2018': 'sec:Ed25519Signature2018',
		'EncryptedMessage': 'sec:EncryptedMessage',
		'GraphSignature2012': 'sec:GraphSignature2012',
		'LinkedDataSignature2015': 'sec:LinkedDataSignature2015',
		'LinkedDataSignature2016': 'sec:LinkedDataSignature2016',
		'CryptographicKey': 'sec:Key',

		'authenticationTag': 'sec:authenticationTag',
		'canonicalizationAlgorithm': 'sec:canonicalizationAlgorithm',
		'cipherAlgorithm': 'sec:cipherAlgorithm',
		'cipherData': 'sec:cipherData',
		'cipherKey': 'sec:cipherKey',
		'created': { '@id': 'dc:created', '@type': 'xsd:dateTime' },
		'creator': { '@id': 'dc:creator', '@type': '@id' },
		'digestAlgorithm': 'sec:digestAlgorithm',
		'digestValue': 'sec:digestValue',
		'domain': 'sec:domain',
		'encryptionKey': 'sec:encryptionKey',
		'expiration': { '@id': 'sec:expiration', '@type': 'xsd:dateTime' },
		'expires': { '@id': 'sec:expiration', '@type': 'xsd:dateTime' },
		'initializationVector': 'sec:initializationVector',
		'iterationCount': 'sec:iterationCount',
		'nonce': 'sec:nonce',
		'normalizationAlgorithm': 'sec:normalizationAlgorithm',
		'owner': { '@id': 'sec:owner', '@type': '@id' },
		'password': 'sec:password',
		'privateKey': { '@id': 'sec:privateKey', '@type': '@id' },
		'privateKeyPem': 'sec:privateKeyPem',
		'publicKey': { '@id': 'sec:publicKey', '@type': '@id' },
		'publicKeyBase58': 'sec:publicKeyBase58',
		'publicKeyPem': 'sec:publicKeyPem',
		'publicKeyWif': 'sec:publicKeyWif',
		'publicKeyService': { '@id': 'sec:publicKeyService', '@type': '@id' },
		'revoked': { '@id': 'sec:revoked', '@type': 'xsd:dateTime' },
		'salt': 'sec:salt',
		'signature': 'sec:signature',
		'signatureAlgorithm': 'sec:signingAlgorithm',
		'signatureValue': 'sec:signatureValue',
	},
} satisfies JsonLd;

const activitystreams = {
	'@context': {
		'@vocab': '_:',
		'xsd': 'http://www.w3.org/2001/XMLSchema#',
		'as': 'https://www.w3.org/ns/activitystreams#',
		'ldp': 'http://www.w3.org/ns/ldp#',
		'vcard': 'http://www.w3.org/2006/vcard/ns#',
		'id': '@id',
		'type': '@type',
		'Accept': 'as:Accept',
		'Activity': 'as:Activity',
		'IntransitiveActivity': 'as:IntransitiveActivity',
		'Add': 'as:Add',
		'Announce': 'as:Announce',
		'Application': 'as:Application',
		'Arrive': 'as:Arrive',
		'Article': 'as:Article',
		'Audio': 'as:Audio',
		'Block': 'as:Block',
		'Collection': 'as:Collection',
		'CollectionPage': 'as:CollectionPage',
		'Relationship': 'as:Relationship',
		'Create': 'as:Create',
		'Delete': 'as:Delete',
		'Dislike': 'as:Dislike',
		'Document': 'as:Document',
		'Event': 'as:Event',
		'Follow': 'as:Follow',
		'Flag': 'as:Flag',
		'Group': 'as:Group',
		'Ignore': 'as:Ignore',
		'Image': 'as:Image',
		'Invite': 'as:Invite',
		'Join': 'as:Join',
		'Leave': 'as:Leave',
		'Like': 'as:Like',
		'Link': 'as:Link',
		'Mention': 'as:Mention',
		'Note': 'as:Note',
		'Object': 'as:Object',
		'Offer': 'as:Offer',
		'OrderedCollection': 'as:OrderedCollection',
		'OrderedCollectionPage': 'as:OrderedCollectionPage',
		'Organization': 'as:Organization',
		'Page': 'as:Page',
		'Person': 'as:Person',
		'Place': 'as:Place',
		'Profile': 'as:Profile',
		'Question': 'as:Question',
		'Reject': 'as:Reject',
		'Remove': 'as:Remove',
		'Service': 'as:Service',
		'TentativeAccept': 'as:TentativeAccept',
		'TentativeReject': 'as:TentativeReject',
		'Tombstone': 'as:Tombstone',
		'Undo': 'as:Undo',
		'Update': 'as:Update',
		'Video': 'as:Video',
		'View': 'as:View',
		'Listen': 'as:Listen',
		'Read': 'as:Read',
		'Move': 'as:Move',
		'Travel': 'as:Travel',
		'IsFollowing': 'as:IsFollowing',
		'IsFollowedBy': 'as:IsFollowedBy',
		'IsContact': 'as:IsContact',
		'IsMember': 'as:IsMember',
		'subject': {
			'@id': 'as:subject',
			'@type': '@id',
		},
		'relationship': {
			'@id': 'as:relationship',
			'@type': '@id',
		},
		'actor': {
			'@id': 'as:actor',
			'@type': '@id',
		},
		'attributedTo': {
			'@id': 'as:attributedTo',
			'@type': '@id',
		},
		'attachment': {
			'@id': 'as:attachment',
			'@type': '@id',
		},
		'bcc': {
			'@id': 'as:bcc',
			'@type': '@id',
		},
		'bto': {
			'@id': 'as:bto',
			'@type': '@id',
		},
		'cc': {
			'@id': 'as:cc',
			'@type': '@id',
		},
		'context': {
			'@id': 'as:context',
			'@type': '@id',
		},
		'current': {
			'@id': 'as:current',
			'@type': '@id',
		},
		'first': {
			'@id': 'as:first',
			'@type': '@id',
		},
		'generator': {
			'@id': 'as:generator',
			'@type': '@id',
		},
		'icon': {
			'@id': 'as:icon',
			'@type': '@id',
		},
		'image': {
			'@id': 'as:image',
			'@type': '@id',
		},
		'inReplyTo': {
			'@id': 'as:inReplyTo',
			'@type': '@id',
		},
		'items': {
			'@id': 'as:items',
			'@type': '@id',
		},
		'instrument': {
			'@id': 'as:instrument',
			'@type': '@id',
		},
		'orderedItems': {
			'@id': 'as:items',
			'@type': '@id',
			'@container': '@list',
		},
		'last': {
			'@id': 'as:last',
			'@type': '@id',
		},
		'location': {
			'@id': 'as:location',
			'@type': '@id',
		},
		'next': {
			'@id': 'as:next',
			'@type': '@id',
		},
		'object': {
			'@id': 'as:object',
			'@type': '@id',
		},
		'oneOf': {
			'@id': 'as:oneOf',
			'@type': '@id',
		},
		'anyOf': {
			'@id': 'as:anyOf',
			'@type': '@id',
		},
		'closed': {
			'@id': 'as:closed',
			'@type': 'xsd:dateTime',
		},
		'origin': {
			'@id': 'as:origin',
			'@type': '@id',
		},
		'accuracy': {
			'@id': 'as:accuracy',
			'@type': 'xsd:float',
		},
		'prev': {
			'@id': 'as:prev',
			'@type': '@id',
		},
		'preview': {
			'@id': 'as:preview',
			'@type': '@id',
		},
		'replies': {
			'@id': 'as:replies',
			'@type': '@id',
		},
		'result': {
			'@id': 'as:result',
			'@type': '@id',
		},
		'audience': {
			'@id': 'as:audience',
			'@type': '@id',
		},
		'partOf': {
			'@id': 'as:partOf',
			'@type': '@id',
		},
		'tag': {
			'@id': 'as:tag',
			'@type': '@id',
		},
		'target': {
			'@id': 'as:target',
			'@type': '@id',
		},
		'to': {
			'@id': 'as:to',
			'@type': '@id',
		},
		'url': {
			'@id': 'as:url',
			'@type': '@id',
		},
		'altitude': {
			'@id': 'as:altitude',
			'@type': 'xsd:float',
		},
		'content': 'as:content',
		'contentMap': {
			'@id': 'as:content',
			'@container': '@language',
		},
		'name': 'as:name',
		'nameMap': {
			'@id': 'as:name',
			'@container': '@language',
		},
		'duration': {
			'@id': 'as:duration',
			'@type': 'xsd:duration',
		},
		'endTime': {
			'@id': 'as:endTime',
			'@type': 'xsd:dateTime',
		},
		'height': {
			'@id': 'as:height',
			'@type': 'xsd:nonNegativeInteger',
		},
		'href': {
			'@id': 'as:href',
			'@type': '@id',
		},
		'hreflang': 'as:hreflang',
		'latitude': {
			'@id': 'as:latitude',
			'@type': 'xsd:float',
		},
		'longitude': {
			'@id': 'as:longitude',
			'@type': 'xsd:float',
		},
		'mediaType': 'as:mediaType',
		'published': {
			'@id': 'as:published',
			'@type': 'xsd:dateTime',
		},
		'radius': {
			'@id': 'as:radius',
			'@type': 'xsd:float',
		},
		'rel': 'as:rel',
		'startIndex': {
			'@id': 'as:startIndex',
			'@type': 'xsd:nonNegativeInteger',
		},
		'startTime': {
			'@id': 'as:startTime',
			'@type': 'xsd:dateTime',
		},
		'summary': 'as:summary',
		'summaryMap': {
			'@id': 'as:summary',
			'@container': '@language',
		},
		'totalItems': {
			'@id': 'as:totalItems',
			'@type': 'xsd:nonNegativeInteger',
		},
		'units': 'as:units',
		'updated': {
			'@id': 'as:updated',
			'@type': 'xsd:dateTime',
		},
		'width': {
			'@id': 'as:width',
			'@type': 'xsd:nonNegativeInteger',
		},
		'describes': {
			'@id': 'as:describes',
			'@type': '@id',
		},
		'formerType': {
			'@id': 'as:formerType',
			'@type': '@id',
		},
		'deleted': {
			'@id': 'as:deleted',
			'@type': 'xsd:dateTime',
		},
		'inbox': {
			'@id': 'ldp:inbox',
			'@type': '@id',
		},
		'outbox': {
			'@id': 'as:outbox',
			'@type': '@id',
		},
		'following': {
			'@id': 'as:following',
			'@type': '@id',
		},
		'followers': {
			'@id': 'as:followers',
			'@type': '@id',
		},
		'streams': {
			'@id': 'as:streams',
			'@type': '@id',
		},
		'preferredUsername': 'as:preferredUsername',
		'endpoints': {
			'@id': 'as:endpoints',
			'@type': '@id',
		},
		'uploadMedia': {
			'@id': 'as:uploadMedia',
			'@type': '@id',
		},
		'proxyUrl': {
			'@id': 'as:proxyUrl',
			'@type': '@id',
		},
		'liked': {
			'@id': 'as:liked',
			'@type': '@id',
		},
		'oauthAuthorizationEndpoint': {
			'@id': 'as:oauthAuthorizationEndpoint',
			'@type': '@id',
		},
		'oauthTokenEndpoint': {
			'@id': 'as:oauthTokenEndpoint',
			'@type': '@id',
		},
		'provideClientKey': {
			'@id': 'as:provideClientKey',
			'@type': '@id',
		},
		'signClientKey': {
			'@id': 'as:signClientKey',
			'@type': '@id',
		},
		'sharedInbox': {
			'@id': 'as:sharedInbox',
			'@type': '@id',
		},
		'Public': {
			'@id': 'as:Public',
			'@type': '@id',
		},
		'source': 'as:source',
		'likes': {
			'@id': 'as:likes',
			'@type': '@id',
		},
		'shares': {
			'@id': 'as:shares',
			'@type': '@id',
		},
		'alsoKnownAs': {
			'@id': 'as:alsoKnownAs',
			'@type': '@id',
		},
	},
} satisfies JsonLd;

const context_iris = [
	'https://www.w3.org/ns/activitystreams',
	'https://w3id.org/security/v1',
];

const extension_context_definition = {
	Key: 'sec:Key',
	// as non-standards
	manuallyApprovesFollowers: 'as:manuallyApprovesFollowers',
	sensitive: 'as:sensitive',
	Hashtag: 'as:Hashtag',
	quoteUrl: 'as:quoteUrl',
	// Mastodon
	toot: 'http://joinmastodon.org/ns#',
	Emoji: 'toot:Emoji',
	featured: 'toot:featured',
	discoverable: 'toot:discoverable',
	// schema
	schema: 'http://schema.org#',
	PropertyValue: 'schema:PropertyValue',
	value: 'schema:value',
	// Misskey
	misskey: 'https://misskey-hub.net/ns#',
	'_misskey_content': 'misskey:_misskey_content',
	'_misskey_quote': 'misskey:_misskey_quote',
	'_misskey_reaction': 'misskey:_misskey_reaction',
	'_misskey_votes': 'misskey:_misskey_votes',
	'_misskey_summary': 'misskey:_misskey_summary',
	'_misskey_followedMessage': 'misskey:_misskey_followedMessage',
	'_misskey_requireSigninToViewContents': 'misskey:_misskey_requireSigninToViewContents',
	'_misskey_makeNotesFollowersOnlyBefore': 'misskey:_misskey_makeNotesFollowersOnlyBefore',
	'_misskey_makeNotesHiddenBefore': 'misskey:_misskey_makeNotesHiddenBefore',
	'_misskey_license': 'misskey:_misskey_license',
	'freeText': {
		'@id': 'misskey:freeText',
		'@type': 'schema:text',
	},
	'isCat': 'misskey:isCat',
	// vcard
	vcard: 'http://www.w3.org/2006/vcard/ns#',
} satisfies Context;

export const CONTEXT: (string | Context)[] = [...context_iris, extension_context_definition];

export const PRELOADED_CONTEXTS: Record<string, JsonLd> = {
	'https://w3id.org/identity/v1': id_v1,
	'https://w3id.org/security/v1': security_v1,
	'https://www.w3.org/ns/activitystreams': activitystreams,
};
