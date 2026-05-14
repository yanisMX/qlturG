"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesModule = void 0;
const common_1 = require("@nestjs/common");
const games_controller_1 = require("./games.controller");
const game_service_1 = require("./game.service");
const game_gateway_1 = require("./game.gateway");
const questions_module_1 = require("../questions/questions.module");
const auth_module_1 = require("../auth/auth.module");
const leaderboard_module_1 = require("../leaderboard/leaderboard.module");
let GamesModule = class GamesModule {
};
exports.GamesModule = GamesModule;
exports.GamesModule = GamesModule = __decorate([
    (0, common_1.Module)({
        imports: [questions_module_1.QuestionsModule, auth_module_1.AuthModule, leaderboard_module_1.LeaderboardModule],
        controllers: [games_controller_1.GamesController],
        providers: [game_service_1.GameService, game_gateway_1.GameGateway],
    })
], GamesModule);
//# sourceMappingURL=games.module.js.map