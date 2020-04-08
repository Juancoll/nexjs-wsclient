export * from './WSApiBase';
export * from './WSServiceBase';

export * from './base/IEventData';
export * from './base/IEventError';
export * from './base/INestJSWSException';
export * from './base/IWSBase';

export * from './types/IWSError';
export * from './types/WSErrorCode';

export * from './socket.io/SocketIOWildcardPatcher';
export * from './socket.io/SocketIOClient';

export * from './clients/hub/HubClient';
export * from './clients/hub/notifications/HubNotification';
export * from './clients/hub/notifications/HubNotificationCredentials';
export * from './clients/hub/notifications/HubNotificationCredentialsData';
export * from './clients/hub/notifications/HubNotificationData';
export * from './clients/hub/messages/IHubRequest';
export * from './clients/hub/messages/IHubResponse';
export * from './clients/hub/types/IHubSubscriptionError';

export * from './clients/rest/RestClient';
export * from './clients/rest/messages/IRestRequest';
export * from './clients/rest/messages/IRestResponse';
