import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IHttpRequestOptions,
	NodeConnectionType,
} from 'n8n-workflow';

export class Vk implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VK',
		name: 'vk',
		icon: 'file:vk.svg', // Предполагаем, что иконка будет добавлена позже
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Interact with the VK API',
		defaults: {
			name: 'VK',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'vkApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Create Post',
						value: 'wallPost',
						description: 'Create a post on a wall',
						action: 'Create a post on a wall',
					},
				],
				default: 'wallPost',
			},
			// === Поля для операции wall.post ===
			{
				displayName: 'Owner ID',
				name: 'ownerId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['wallPost'],
					},
				},
				description: 'User or community ID (negative for communities). If empty, posts on the current user wall.',
				placeholder: '-123456',
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 5,
				},
				displayOptions: {
					show: {
						operation: ['wallPost'],
					},
				},
				description: 'Post text. Required if attachments are not set.',
			},
			{
				displayName: 'Attachments',
				name: 'attachments',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['wallPost'],
					},
				},
				description: 'Comma-separated list of attachments (e.g., photo123_456,video-123_789). Required if message is not set.',
				placeholder: 'photo123_456,https://example.com',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						operation: ['wallPost'],
					},
				},
				options: [
					{
						displayName: 'From Group',
						name: 'fromGroup',
						type: 'boolean',
						default: false,
						description: 'Whether to post on behalf of the community (if owner_id is a community)',
					},
					{
						displayName: 'Friends Only',
						name: 'friendsOnly',
						type: 'boolean',
						default: false,
						description: 'Whether the post should be visible only to friends',
					},
					{
						displayName: 'Signed',
						name: 'signed',
						type: 'boolean',
						default: false,
						description: 'Whether to add the user signature (if posting from group as user)',
					},
					{
						displayName: 'Publish Date (Unix Timestamp)',
						name: 'publishDate',
						type: 'number',
						default: 0,
						description: 'Unix timestamp for scheduled posting. Set 0 to publish immediately.',
					},
					{
						displayName: 'Mark as Ads',
						name: 'markAsAds',
						type: 'boolean',
						default: false,
						description: 'Whether to mark the post as advertisement (for community posts)',
					},
					{
						displayName: 'Close Comments',
						name: 'closeComments',
						type: 'boolean',
						default: false,
						description: 'Whether to disable comments for the post',
					},
					{
						displayName: 'Mute Notifications',
						name: 'muteNotifications',
						type: 'boolean',
						default: false,
						description: 'Whether to disable notifications for the post',
					},
					// Можно добавить другие необязательные поля: lat, long, place_id, guid, link_title, link_photo_id, donut_paid_duration
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;

		// Получаем учетные данные OAuth2
		const credentials = await this.getCredentials('vkApi');
		// AccessToken теперь находится внутри credentials объекта OAuth2
		// ApiVersion получаем из параметров узла, так как он теперь там
		const apiVersion = this.getNodeParameter('apiVersion', 0, '5.199') as string;

		// Итерируемся по входным данным
		for (let i = 0; i < length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				if (operation === 'wallPost') {
					// Получаем параметры для wall.post
					const ownerId = this.getNodeParameter('ownerId', i, '') as string;
					const message = this.getNodeParameter('message', i, '') as string;
					const attachments = this.getNodeParameter('attachments', i, '') as string;
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as {
						fromGroup?: boolean;
						friendsOnly?: boolean;
						signed?: boolean;
						publishDate?: number;
						markAsAds?: boolean;
						closeComments?: boolean;
						muteNotifications?: boolean;
					};

					// Формируем тело запроса
					const body: Record<string, any> = {};
					if (ownerId) body.owner_id = ownerId;
					if (message) body.message = message;
					if (attachments) body.attachments = attachments;
					if (additionalFields.fromGroup !== undefined) body.from_group = additionalFields.fromGroup ? 1 : 0;
					if (additionalFields.friendsOnly !== undefined) body.friends_only = additionalFields.friendsOnly ? 1 : 0;
					if (additionalFields.signed !== undefined) body.signed = additionalFields.signed ? 1 : 0;
					if (additionalFields.publishDate !== undefined && additionalFields.publishDate > 0) body.publish_date = additionalFields.publishDate;
					if (additionalFields.markAsAds !== undefined) body.mark_as_ads = additionalFields.markAsAds ? 1 : 0;
					if (additionalFields.closeComments !== undefined) body.close_comments = additionalFields.closeComments ? 1 : 0;
					if (additionalFields.muteNotifications !== undefined) body.mute_notifications = additionalFields.muteNotifications ? 1 : 0;

					// Проверка обязательных полей
					if (!body.message && !body.attachments) {
						throw new NodeOperationError(this.getNode(), 'Either Message or Attachments must be provided.', { itemIndex: i });
					}

					// Определяем параметры запроса
					const options: IHttpRequestOptions = {
						url: `https://api.vk.com/method/wall.post`,
						method: 'POST',
						qs: {
							// Добавляем access_token из credentials и apiVersion
							access_token: credentials.accessToken as string,
							v: apiVersion,
						},
						body: body,
						headers: {
							'Content-Type': 'application/x-www-form-urlencoded',
						},
					};

					// Выполняем запрос
					const responseData = await this.helpers.httpRequest(options);

					// Проверяем на наличие ошибки в ответе VK API
					if (responseData.error) {
						throw new NodeOperationError(this.getNode(), `VK API error: ${responseData.error.error_msg} (Code: ${responseData.error.error_code})`, {
							itemIndex: i,
							description: JSON.stringify(responseData.error),
						});
					}

					// Добавляем результат в выходные данные
					returnData.push({ json: responseData.response, pairedItem: { item: i } });

				} else {
					throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported.`, { itemIndex: i });
				}

			} catch (error) {
				if (this.continueOnFail()) {
					// Проверяем тип error перед доступом к message
					const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
					returnData.push({ json: { error: errorMessage }, pairedItem: { item: i } });
					continue;
				} else {
					// Включаем оригинальную ошибку для лучшей диагностики
					// Проверяем наличие context перед доступом
					if (error && typeof error === 'object' && 'context' in error) {
						// Мы не можем быть уверены в типе context, используем any или более строгую проверку
						(error as any).context.itemIndex = i;
					}
					throw error;
				}
			}
		}

		return [returnData];
	}
} 