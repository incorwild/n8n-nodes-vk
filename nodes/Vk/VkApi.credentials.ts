import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class VkApi implements ICredentialType {
	name = 'vkApi';
	// Наследуем стандартный OAuth2 обработчик n8n
	extends = ['oAuth2Api'];
	displayName = 'VK API';
	// Ссылка на документацию (можно добавить свою, если будет)
	documentationUrl = 'vk'; // Или ссылка на GitHub/документацию VK API
	properties: INodeProperties[] = [
		// Стандартные скрытые поля для oAuth2Api
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode', // Используем authorizationCode (PKCE - его расширение)
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://id.vk.com/authorize', // URL авторизации VK ID
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://id.vk.com/oauth2/auth', // URL обмена кода на токен VK ID
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'string',
			default: 'wall', // Запрашиваемые права доступа по умолчанию
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '', // Дополнительные параметры для URL авторизации, если нужны
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			// Способ передачи client_id/secret при обмене токена.
			// 'body' - это то, что требует VK ('client_id=...&client_secret=...')
			// 'header' - это Basic Auth (стандарт OAuth2, но не для VK ID token endpoint)
			// Попробуем 'body'
			default: 'body',
		},
		// --- Поля, видимые пользователю ---
		// clientId и clientSecret будут унаследованы от oAuth2Api, их здесь определять не нужно.
		// Нужно только добавить специфичные для нашего узла поля.
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string',
			default: '5.199',
			description: 'The VK API version to use (e.g., 5.199)',
		},
	];
} 