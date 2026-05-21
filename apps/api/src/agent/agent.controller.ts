import { Controller, Post, Body, UseGuards, Request } from "@nestjs/common";
import { AgentService } from "./agent.service";
import { SupabaseAuthGuard } from "src/users/supabase-auth.guard";

@Controller('agent')
export class AgentController {
    constructor(private readonly agentService: AgentService) {}

    @Post('chat')
    @UseGuards(SupabaseAuthGuard)
    async handleAgentMessage(
        @Request() req,
        @Body() body: { message: string, history?: any[] }
    ) {
        return await this.agentService.processAgentChat(
            req.user.id,
            body.message,
            body.history || []
        );
    }
}