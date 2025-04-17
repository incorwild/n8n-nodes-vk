import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class VkApi implements ICredentialType {
	name = 'vkApi';
	displayName = 'VK API';
	properties: INodeProperties[] = [
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Your VK User Access Token. Requires "wall" scope. Obtain via Implicit Flow for Standalone apps.',
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '5.199', // Укажем актуальную версию API
			description: 'The VK API version to use (e.g., 5.199)',
		},
	];
} 