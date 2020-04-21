"use strict";
/**
 * @module botkit-adapter-telegram
 */
/**
 * Copyright (c) Dynameyes. All rights reserved.
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
/**
 * This adapter middleware, when used in conjunction with TelegramAdapter and Botkit, will result in Botkit emitting events with
 * names based on their event type.
 *
 * ```javascript
 * const adapter = new TelegramAdapter(MY_OPTIONS);
 * adapter.use(new TelegramEventTypeMiddleware());
 * const controller = new Botkit({
 *      adapter: adapter,
 * });
 *
 * // define a handler for one of the new events
 * controller.on('telegram_option', async(bot, message) => {
 *      // ...
 * });
 * ```
 *
 * When used, events emitted may include:
 * * telegram_postback
 * * telegram_referral
 * * telegram_optin
 * * message_delivered
 * * message_read
 * * telegram_account_linking
 * * message_echo
 * * telegram_app_roles
 * * standby
 * * telegram_receive_thread_control
 * * telegram_request_thread_control
 *
 */
class TelegramEventTypeMiddleware extends botbuilder_1.MiddlewareSet {
    /**
     * Implements the middleware's onTurn function. Called automatically.
     * @ignore
     * @param context
     * @param next
     */
    onTurn(context, next) {
        return __awaiter(this, void 0, void 0, function* () {
            /**
             * In Telegram channelData here would be the Message type. See https://core.telegram.org/bots/api#message for possible properties
             * @todo Update accordingly as we progress since we will not use all event types anyway. At least for now.
             */
						if (context.activity && context.activity.channelData) {
							let type = null;
							if (context.activity.channelData.callback_query) {
								type = 'telegram_callback_query';
							}
							context.activity.channelData.botkitEventType = type;
						}
            // if (context.activity && context.activity.channelData) {
            //     let type = null;
            //     if (context.activity.channelData.postback) {
            //         type = 'telegram_postback';
            //     } else if (context.activity.channelData.referral) {
            //         type = 'telegram_referral';
            //     } else if (context.activity.channelData.optin) {
            //         type = 'telegram_optin';
            //     } else if (context.activity.channelData.delivery) {
            //         type = 'message_delivered';
            //     } else if (context.activity.channelData.read) {
            //         type = 'message_read';
            //     } else if (context.activity.channelData.account_linking) {
            //         type = 'telegram_account_linking';
            //     } else if (context.activity.channelData.message && context.activity.channelData.message.is_echo) {
            //         type = 'message_echo';
            //         context.activity.type = ActivityTypes.Event;
            //     } else if (context.activity.channelData.app_roles) {
            //         type = 'telegram_app_roles';
            //     } else if (context.activity.channelData.standby) {
            //         type = 'standby';
            //     } else if (context.activity.channelData.pass_thread_control) {
            //         type = 'telegram_receive_thread_control';
            //     } else if (context.activity.channelData.take_thread_control) {
            //         type = 'telegram_lose_thread_control';
            //     } else if (context.activity.channelData.request_thread_control) {
            //         type = 'telegram_request_thread_control';
            //     }
            //
            //     context.activity.channelData.botkitEventType = type;
            // }
            yield next();
        });
    }
}
exports.TelegramEventTypeMiddleware = TelegramEventTypeMiddleware;
//# sourceMappingURL=telegram_event_middleware.js.map