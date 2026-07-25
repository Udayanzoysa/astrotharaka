import { IsIn } from 'class-validator';

export class SendGuestReportDto {
  @IsIn(['email', 'whatsapp'])
  channel!: 'email' | 'whatsapp';
}
