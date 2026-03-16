package com.nossagrana.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class EmailService {

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    private final RestClient restClient = RestClient.create();

    public void enviarConvite(String emailDestino, String nomeParceiro1, String codigoConvite) {
        String link = frontendUrl + "/convite/" + codigoConvite;

        String htmlContent = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0; padding:0; background-color:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">

              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding: 40px 16px;">
                <tr><td align="center">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:560px;">

                    <!-- Logo / Header -->
                    <tr><td align="center" style="padding-bottom: 24px;">
                      <div style="display:inline-block; background: linear-gradient(135deg, #059669, #047857); border-radius: 16px; padding: 14px 24px;">
                        <span style="color: white; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">💰 NossaGrana</span>
                      </div>
                    </td></tr>

                    <!-- Card principal -->
                    <tr><td style="background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

                      <!-- Banner verde -->
                      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 36px 40px 32px; text-align: center;">
                        <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; line-height: 64px;">
                          🤝
                        </div>
                        <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px; line-height: 1.3;">
                          Você foi convidado!
                        </h1>
                        <p style="color: rgba(255,255,255,0.85); font-size: 15px; margin: 0; line-height: 1.5;">
                          <strong style="color:#ffffff;">%s</strong> quer gerenciar as finanças do casal junto com você
                        </p>
                      </div>

                      <!-- Corpo -->
                      <div style="padding: 36px 40px;">

                        <!-- Aviso importante -->
                        <div style="background: #FFF5F5; border-left: 4px solid #EF4444; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
                          <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #DC2626; text-transform: uppercase; letter-spacing: 0.5px;">
                            ⚠️ Atenção — leia antes de aceitar
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #7f1d1d; line-height: 1.6;">
                            Ao aceitar, <strong>todas as suas despesas registradas sozinho serão excluídas</strong>.
                            A partir daí, você e %s passarão a compartilhar as finanças no NossaGrana.
                          </p>
                        </div>

                        <!-- Benefícios -->
                        <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
                          <tr>
                            <td style="padding: 10px 12px; background:#f0fdf4; border-radius:10px; width:48%%;">
                              <p style="margin:0; font-size:20px; text-align:center;">📊</p>
                              <p style="margin:4px 0 0; font-size:12px; color:#065f46; font-weight:600; text-align:center;">Relatórios do casal</p>
                            </td>
                            <td style="width:4%%"></td>
                            <td style="padding: 10px 12px; background:#f0fdf4; border-radius:10px; width:48%%;">
                              <p style="margin:0; font-size:20px; text-align:center;">💸</p>
                              <p style="margin:4px 0 0; font-size:12px; color:#065f46; font-weight:600; text-align:center;">Divisão de gastos</p>
                            </td>
                          </tr>
                        </table>

                        <!-- Botão CTA -->
                        <div style="text-align: center; margin-bottom: 24px;">
                          <a href="%s"
                             style="display: inline-block; background: linear-gradient(135deg, #059669, #047857);
                                    color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700;
                                    padding: 16px 48px; border-radius: 12px; letter-spacing: 0.3px;
                                    box-shadow: 0 4px 12px rgba(5,150,105,0.4);">
                            Aceitar Convite →
                          </a>
                        </div>

                        <!-- Expiração -->
                        <p style="text-align:center; margin: 0 0 8px; font-size: 13px; color: #6b7280;">
                          🕐 Este link expira em <strong style="color:#374151;">48 horas</strong>
                        </p>

                      </div>

                      <!-- Footer do card -->
                      <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 40px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                          Se você não tem uma conta no NossaGrana ou não conhece %s, ignore este email com segurança.
                        </p>
                      </div>

                    </td></tr>

                    <!-- Footer externo -->
                    <tr><td align="center" style="padding-top: 24px;">
                      <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2025 NossaGrana · Finanças do casal</p>
                    </td></tr>

                  </table>
                </td></tr>
              </table>

            </body>
            </html>
            """.formatted(nomeParceiro1, nomeParceiro1, link, nomeParceiro1);

        enviarEmail(emailDestino, nomeParceiro1 + " te convidou para o NossaGrana", htmlContent);
        log.info("Email de convite enviado para {}", emailDestino);
    }

    public void enviarCodigoVerificacao(String emailDestino, String nome, String codigo) {
        String htmlContent = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0; padding:0; background-color:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding: 40px 16px;">
                <tr><td align="center">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:480px;">
                    <tr><td align="center" style="padding-bottom: 24px;">
                      <div style="display:inline-block; background: linear-gradient(135deg, #059669, #047857); border-radius: 16px; padding: 14px 24px;">
                        <span style="color: white; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">💰 NossaGrana</span>
                      </div>
                    </td></tr>
                    <tr><td style="background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                      <div style="background: linear-gradient(135deg, #059669, #047857); padding: 32px 40px; text-align: center;">
                        <div style="font-size: 40px; margin-bottom: 12px;">✉️</div>
                        <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0;">Confirme seu email</h1>
                        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0;">Olá, <strong style="color:#fff;">%s</strong>! Use o código abaixo para verificar sua conta.</p>
                      </div>
                      <div style="padding: 36px 40px; text-align: center;">
                        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">Seu código de verificação:</p>
                        <div style="display: inline-block; background: #f0fdf4; border: 2px dashed #059669; border-radius: 16px; padding: 20px 40px; margin-bottom: 24px;">
                          <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #059669;">%s</span>
                        </div>
                        <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">🕐 Este código expira em <strong style="color:#374151;">24 horas</strong></p>
                        <p style="margin: 0; font-size: 13px; color: #9ca3af;">Se você não criou uma conta no NossaGrana, ignore este email.</p>
                      </div>
                      <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 40px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2025 NossaGrana · Finanças do casal</p>
                      </div>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(nome, codigo);

        enviarEmail(emailDestino, "Confirme seu email — NossaGrana", htmlContent);
        log.info("Email de verificação enviado para {}", emailDestino);
    }

    public void enviarCodigoResetSenha(String emailDestino, String nome, String codigo) {
        String htmlContent = """
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin:0; padding:0; background-color:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding: 40px 16px;">
                <tr><td align="center">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="max-width:480px;">
                    <tr><td align="center" style="padding-bottom: 24px;">
                      <div style="display:inline-block; background: linear-gradient(135deg, #059669, #047857); border-radius: 16px; padding: 14px 24px;">
                        <span style="color: white; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">💰 NossaGrana</span>
                      </div>
                    </td></tr>
                    <tr><td style="background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
                      <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 32px 40px; text-align: center;">
                        <div style="font-size: 40px; margin-bottom: 12px;">🔐</div>
                        <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0;">Redefinir senha</h1>
                        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0;">Olá, <strong style="color:#fff;">%s</strong>! Use o código abaixo para criar uma nova senha.</p>
                      </div>
                      <div style="padding: 36px 40px; text-align: center;">
                        <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280;">Seu código de redefinição:</p>
                        <div style="display: inline-block; background: #fef2f2; border: 2px dashed #dc2626; border-radius: 16px; padding: 20px 40px; margin-bottom: 24px;">
                          <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #dc2626;">%s</span>
                        </div>
                        <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">⚠️ Este código expira em <strong style="color:#374151;">15 minutos</strong></p>
                        <p style="margin: 0; font-size: 13px; color: #9ca3af;">Se você não solicitou a redefinição de senha, ignore este email. Sua senha não será alterada.</p>
                      </div>
                      <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 40px; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #9ca3af;">© 2025 NossaGrana · Finanças do casal</p>
                      </div>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(nome, codigo);

        enviarEmail(emailDestino, "Redefinição de senha — NossaGrana", htmlContent);
        log.info("Email de reset de senha enviado para {}", emailDestino);
    }

    private void enviarEmail(String emailDestino, String assunto, String htmlContent) {
        Map<String, Object> payload = Map.of(
            "sender", Map.of("name", "NossaGrana", "email", "nossagrana.noreply@gmail.com"),
            "to", List.of(Map.of("email", emailDestino)),
            "subject", assunto,
            "htmlContent", htmlContent
        );

        try {
            restClient.post()
                .uri("https://api.brevo.com/v3/smtp/email")
                .header("api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(payload)
                .retrieve()
                .toBodilessEntity();
        } catch (Exception e) {
            log.error("Erro ao enviar email para {}: {}", emailDestino, e.getMessage());
            throw new RuntimeException("Erro ao enviar email. Tente novamente.");
        }
    }
}
