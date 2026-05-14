"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesController = void 0;
const common_1 = require("@nestjs/common");
const game_service_1 = require("./game.service");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreateGameDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(client_1.Difficulty),
    __metadata("design:type", String)
], CreateGameDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], CreateGameDto.prototype, "totalQuestions", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateGameDto.prototype, "speedBonus", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.GameMode),
    __metadata("design:type", String)
], CreateGameDto.prototype, "gameMode", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], CreateGameDto.prototype, "questionDuration", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateGameDto.prototype, "doublePointsBonus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(client_1.Topic, { each: true }),
    __metadata("design:type", Array)
], CreateGameDto.prototype, "topics", void 0);
class JoinGameDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JoinGameDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], JoinGameDto.prototype, "nickname", void 0);
let GamesController = class GamesController {
    constructor(gameService) {
        this.gameService = gameService;
    }
    create(dto) {
        return this.gameService.createGame(dto);
    }
    join(dto) {
        return this.gameService.joinGame(dto);
    }
    getByCode(code) {
        return this.gameService.getGameByCode(code);
    }
};
exports.GamesController = GamesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateGameDto]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [JoinGameDto]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "join", null);
__decorate([
    (0, common_1.Get)(':code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GamesController.prototype, "getByCode", null);
exports.GamesController = GamesController = __decorate([
    (0, common_1.Controller)('games'),
    __metadata("design:paramtypes", [game_service_1.GameService])
], GamesController);
//# sourceMappingURL=games.controller.js.map