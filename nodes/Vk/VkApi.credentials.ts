import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class VkApi implements ICredentialType {
	name = 'vkApi';
	displayName = 'VK API';
	authentication = {
		type: 'oauth2' as const,
		authUrl: 'https://id.vk.com/authorize',
		accessTokenUrl: 'https://id.vk.com/oauth2/auth',
		scope: 'wall',
		authCodeGrantType: 'pkce' as const,
		tokenCredentials: {
			clientId: {
				in: 'body' as const,
			},
		},
		defaults: {
			// Можно добавить сюда client_id по умолчанию, если он известен, но лучше оставить пустым
			// apiVersion: '5.199', // Можно добавить версию API здесь, если нужно
		},
	};
	properties: INodeProperties[] = [
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			description: 'Client ID from your VK Application settings.',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Client Secret from your VK Application settings (may not be required for PKCE web flow).',
			required: true,
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '5.199',
			description: 'The VK API version to use (e.g., 5.199)',
		},
		// Scope теперь настраивается в окне подключения OAuth2, убираем его отсюда
		// {
		// 	displayName: 'Scope',
		// 	name: 'scope',
		// 	type: 'string',
		// 	default: 'wall',
		// 	description: 'Space-separated list of permissions to request (e.g., wall email phone).',
		// },
	];
} 