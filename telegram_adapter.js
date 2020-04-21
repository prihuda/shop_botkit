"use strict";
/**
 * @module botkit-adapter-telegram
 */
/**
 * Copyright (c) Dynameyes Inc. All rights reserved.
 * Licensed under the MIT License.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const botbuilder_1 = require("botbuilder");
const Debug = require("debug");
const botworker_1 = require("./botworker");
const telegram_api_1 = require("./telegram_api");
const _get = require("lodash/get");
const _last = require("lodash/last");
const debug = Debug('botkit:telegram');
/**
 * Connect [Botkit](https://www.npmjs.com/package/botkit) to Telegram Messenger.
 */
class TelegramAdapter extends botbuilder_1.BotAdapter {
    /**
     * Create an adapter to handle incoming messages from Telegram and translate them into a standard format for processing by your bot.
     *
     * To use with Botkit:
     * ```javascript
     * const adapter = new TelegramAdapter({
     *     access_token: process.env.TELEGRAM_TOKEN,
     *     webhook_url_host_name: process.env.TELEGRAM_WEBHOOK_URL_HOST_NAME
     * });
     * const controller = new Botkit({
     *      adapter: adapter,
     *      // other options
     * });
     * ```
     *
     * @param options Configuration options
     */
    constructor(options) {
        super();
        /**
         * Name used by Botkit plugin loader
         * @ignore
         */
        this.name = 'Telegram Adapter';
        /**
         * A customized BotWorker object that exposes additional utility methods.
         * @ignore
         */
        this.botkit_worker = botworker_1.TelegramBotWorker;
        this.options = Object.assign({ api_host: 'api.telegram.org/bot' }, options);
        this.middlewares = {
            spawn: [
                (bot, next) => __awaiter(this, void 0, void 0, function* () {
                    bot.api = yield this.getAPI(bot.getConfig('activity'));
                    next();
                })
            ]
        };
    }
    /**
     * Botkit-only: Initialization function called automatically when used with Botkit.
     * Setups the webhook accordingly
     *
     * @param botkit
     */
    init(botkit) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${this.options.webhook_url_host_name}${botkit.getConfig('webhook_uri')}`;
            debug('Setup webhook for incoming messages from telegram: ', url);
            const telegramAPI = new telegram_api_1.TelegramAPI(this.options.access_token);
            /**
             * Delete previous webhook before assigning a new one. For now lets assume our bot can only have 1 webhook
             */
            const webHookInfoForIncomingMessage = yield telegramAPI.callAPI("getWebhookInfo", "POST");
            debug('GET INFO ON CURRENT WEBHOOK', webHookInfoForIncomingMessage);
            const webHookDeleteForIncomingMessage = yield telegramAPI.callAPI("deleteWebhook", "POST");
            debug('DELETE CURRENT WEBHOOK', webHookDeleteForIncomingMessage);
            const webHookSetForIncomingMessage = yield telegramAPI.callAPI("setWebhook", "POST", { url });
            debug('SET NEW WEBHOOK', webHookSetForIncomingMessage);
        });
    }
    /**
     * Get a Telegram API client with the correct credentials based on the page identified in the incoming activity.
     * This is used by many internal functions to get access to the Telegram API, and is exposed as `bot.api` on any BotWorker instances passed into Botkit handler functions.
     *
     * ```javascript
     * let api = adapter.getAPI(activity);
     * let res = api.callAPI('getMe', 'GET');
     * ```
     * @param activity An incoming message activity
     */
    getAPI(activity) {
        return __awaiter(this, void 0, void 0, function* () {
            return new telegram_api_1.TelegramAPI(this.options.access_token);
        });
    }
    /**
     * Converts an Activity object to a Telegram messenger outbound message ready for the API.
     * @see https://core.telegram.org/bots/api#sendmessage
     *
     * @param activity
     */
    activityToTelegram(activity) {
        const replyKeyboard = _get(activity, 'channelData.replyKeyboard') || _get(activity, 'attachments.replyKeyboard');
        const parseMode = _get(activity, 'channelData.parseMode');
        const noWebPreview = _get(activity, 'channelData.noWebPreview', false);
        const message = {
            chat_id: activity.conversation.id,
            text: activity.text,
            parse_mode: parseMode,
            disable_web_page_preview: noWebPreview,
            // disable_notification: undefined,
            // reply_to_message_id: undefined,
            reply_markup: replyKeyboard
        };
        // TODO: properly map other message meta data depending on received response
        // if (activity.channelData) {
        //     if (activity.channelData.messaging_type) {
        //         message.messaging_type = activity.channelData.messaging_type;
        //     }
        //     if (activity.channelData.tag) {
        //         message.tag = activity.channelData.tag;
        //     }
        //     if (activity.channelData.sticker_id) {
        //         message.message.sticker_id = activity.channelData.sticker_id;
        //     }
        //     if (activity.channelData.attachment) {
        //         message.message.attachment = activity.channelData.attachment;
        //     }
        //     if (activity.channelData.persona_id) {
        //         message.persona_id = activity.channelData.persona_id;
        //     }
        //     if (activity.channelData.notification_type) {
        //         message.notification_type = activity.channelData.notification_type;
        //     }
        //     if (activity.channelData.sender_action) {
        //         message.sender_action = activity.channelData.sender_action;
        //     }
        //     // make sure the quick reply has a type
        //     if (activity.channelData.quick_replies) {
        //         message.message.quick_replies = activity.channelData.quick_replies.map(function (item) {
        //             const quick_reply = Object.assign({}, item);
        //             if (!item.content_type)
        //                 quick_reply.content_type = 'text';
        //             return quick_reply;
        //         });
        //     }
        // }
        debug('OUT TO TELEGRAM > ', message);
        return message;
    }
    /**
     * Standard BotBuilder adapter method to send a message from the bot to the messaging API.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#sendactivities).
     * @see https://core.telegram.org/bots/api#available-methods
     *
     * @param context A TurnContext representing the current incoming message and environment.
     * @param activities An array of outgoing activities to be sent back to the messaging API.
     */
    sendActivities(context, activities) {
        return __awaiter(this, void 0, void 0, function* () {
            const responses = [];
            for (let a = 0; a < activities.length; a++) {
                const activity = activities[a];
                if (activity.type === botbuilder_1.ActivityTypes.Message) {
                    const message = this.activityToTelegram(activity);
                    try {
                        const api = yield this.getAPI(context.activity);
                        // TODO: Properly use different methods depending on the message type to send
                        const res = yield api.callAPI('sendMessage', 'POST', message);
                        if (res) {
                            responses.push({ id: res.message_id });
                        }
                        debug('RESPONSE FROM TELEGRAM > ', res);
                    }
                    catch (err) {
                        console.error('Error sending activity to Telegram:', err);
                    }
                }
                else {
                    // If there are ever any non-message type events that need to be sent, do it here.
                    debug('Unknown message type encountered in sendActivities: ', activity.type);
                }
            }
            return responses;
        });
    }
    /**
     * Telegram adapter does not yet support updateActivity.
     * @ignore
     */
    // eslint-disable-next-line
    updateActivity(context, activity) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('Telegram adapter does not yet support updateActivity.');
        });
    }
    /**
     * Telegram adapter does not yet support updateActivity.
     * @ignore
     */
    // eslint-disable-next-line
    deleteActivity(context, reference) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('Telegram adapter does not yet support deleteActivity.');
        });
    }
    /**
     * Standard BotBuilder adapter method for continuing an existing conversation based on a conversation reference.
     * [BotBuilder reference docs](https://docs.microsoft.com/en-us/javascript/api/botbuilder-core/botadapter?view=botbuilder-ts-latest#continueconversation)
     * @param reference A conversation reference to be applied to future messages.
     * @param logic A bot logic function that will perform continuing action in the form `async(context) => { ... }`
     */
    continueConversation(reference, logic) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = botbuilder_1.TurnContext.applyConversationReference({ type: 'event', name: 'continueConversation' }, reference, true);
            const context = new botbuilder_1.TurnContext(this, request);
            return this.runMiddleware(context, logic);
        });
    }
    /**
     * Accept an incoming webhook request and convert it into a TurnContext which can be processed by the bot's logic.
     * @see https://core.telegram.org/bots/api#getting-updates
     *
     * @param req A request object from Restify or Express
     * @param res A response object from Restify or Express
     * @param logic A bot logic function in the form `async(context) => { ... }`
     */
    processActivity(req, res, logic) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('IN FROM TELEGRAM >', req.body);
            const event = req.body;
			// console.log('Event: ', event);
            // TODO: Also support other update types
            if (event.message && event.message.message_id) {
                this.processSingleMessage(event, logic);
            }
			else if (event.callback_query) {
                this.processSingleMessage2(event, logic);
            }
            res.status(200);
            res.end();
        });
    }
    /**
     * Handles each individual message inside a webhook payload (webhook may deliver more than one message at a time)
     *
     * @param message
     * @param logic
     */
    processSingleMessage(message, logic) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message.message.from) {
                // @see https://core.telegram.org/bots/api#message
                debug('empty for messages sent to channels', message);
            }
            const activity = {
                channelId: 'telegram',
                timestamp: new Date(),
                // @ts-ignore ignore optional fields
                conversation: {
                    id: message.message.chat.id
                },
                from: {
                    id: message.message.from.id,
                    name: message.message.from.first_name,
                },
                recipient: {
                    id: message.message.from.id,
                    name: message.message.from.username,
                },
                channelData: message.message,
                type: botbuilder_1.ActivityTypes.Event,
                text: null
            };
            if (message.message && message.message.photo) {
                // message.message.photo is an array of objects with increasing image size. We only need to take the image with the highest resolution.
                const highestResolutionImage = _last(message.message.photo);
                const telegramAPI = yield this.getAPI(message);
                const getFileResult = yield telegramAPI.callAPI('getFile', 'POST', {
                    file_id: highestResolutionImage.file_id
                });
                const rawFileResult = yield telegramAPI.callAPI(getFileResult.result.file_path, 'GET', {}, "file/bot");
                activity.channelData.photo = Object.assign(Object.assign({}, getFileResult.result), { data: Buffer.from(rawFileResult) });
            }
            if (message.message) {
                activity.type = botbuilder_1.ActivityTypes.Message;
                activity.text = message.message.text;
                // TODO: Also support other message types such as images
                // if (activity.channelData.message.is_echo) {
                //     activity.type = ActivityTypes.Event;
                // }
                // copy fields like attachments, sticker, quick_reply, nlp, etc.
                // for (const key in message.message) {
                //     activity.channelData[key] = message.message[key];
                // }
            }
            const context = new botbuilder_1.TurnContext(this, activity);
            yield this.runMiddleware(context, logic);
        });
    }
		
	processSingleMessage2(message, logic) {
        return __awaiter(this, void 0, void 0, function* () {
            /* if (!message.message.from) {
                // @see https://core.telegram.org/bots/api#message
                debug('empty for messages sent to channels', message);
            } */
            const activity = {
                channelId: 'telegram',
                timestamp: new Date(),
                // @ts-ignore ignore optional fields
                conversation: {
                    id: message.callback_query.message.chat.id
                },
                from: {
                    id: message.callback_query.from.id,
                    name: message.callback_query.from.first_name,
                },
                recipient: {
                    id: message.callback_query.message.from.id,
                    name: message.callback_query.message.from.first_name,
                },
                channelData: message,
                type: botbuilder_1.ActivityTypes.Event,
                text: null
            };
            if (message.message && message.message.photo) {
                // message.message.photo is an array of objects with increasing image size. We only need to take the image with the highest resolution.
                const highestResolutionImage = _last(message.message.photo);
                const telegramAPI = yield this.getAPI(message);
                const getFileResult = yield telegramAPI.callAPI('getFile', 'POST', {
                    file_id: highestResolutionImage.file_id
                });
                const rawFileResult = yield telegramAPI.callAPI(getFileResult.result.file_path, 'GET', {}, "file/bot");
                activity.channelData.photo = Object.assign(Object.assign({}, getFileResult.result), { data: Buffer.from(rawFileResult) });
            }
            if (message.message) {
                activity.type = botbuilder_1.ActivityTypes.Message;
                activity.text = message.message.text;
                // TODO: Also support other message types such as images
                // if (activity.channelData.message.is_echo) {
                //     activity.type = ActivityTypes.Event;
                // }
                // copy fields like attachments, sticker, quick_reply, nlp, etc.
                // for (const key in message.message) {
                //     activity.channelData[key] = message.message[key];
                // }
            }
            const context = new botbuilder_1.TurnContext(this, activity);
            yield this.runMiddleware(context, logic);
        });
    }
}
exports.TelegramAdapter = TelegramAdapter;
//# sourceMappingURL=telegram_adapter.js.map
