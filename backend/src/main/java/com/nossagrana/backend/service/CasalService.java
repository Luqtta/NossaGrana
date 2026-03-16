package com.nossagrana.backend.service;

import com.nossagrana.backend.entity.Casal;
import com.nossagrana.backend.entity.Despesa;
import com.nossagrana.backend.entity.Usuario;
import com.nossagrana.backend.repository.CasalRepository;
import com.nossagrana.backend.repository.DespesaRepository;
import com.nossagrana.backend.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CasalService {
    
    private final CasalRepository casalRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final DespesaRepository despesaRepository;
    
    public Casal buscarPorId(Long id) {
        return casalRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Casal não encontrado"));
    }
    
    public void convidarParceiro(Long casalId, String email, String senha, String nome) {
        Casal casal = casalRepository.findById(casalId)
            .orElseThrow(() -> new RuntimeException("Casal não encontrado"));
        
        if (casal.getConviteAceito()) {
            throw new RuntimeException("Já existe um parceiro neste casal");
        }
        
        if (usuarioRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email já cadastrado");
        }
        
        Usuario parceiro2 = Usuario.builder()
            .nome(nome)
            .email(email)
            .senha(passwordEncoder.encode(senha))
            .casal(casal)
            .ehParceiro1(false)
            .build();
        
        usuarioRepository.save(parceiro2);
        
        casal.setEmailConviteParceiro2(email);
        casal.setNomeParceiro2(nome);
        casal.setConviteAceito(true);
        
        casalRepository.save(casal);
    }
    
    public void removerParceiro(Long casalId) {
        Casal casal = casalRepository.findById(casalId)
            .orElseThrow(() -> new RuntimeException("Casal não encontrado"));
        
        // Ao invés de deletar o usuário, apenas remove ele do casal
        if (casal.getEmailConviteParceiro2() != null) {
            usuarioRepository.findByEmail(casal.getEmailConviteParceiro2())
                .ifPresent(usuario -> {
                    usuario.setCasal(null);
                    usuarioRepository.save(usuario);
                });
        }
        
        // Limpar dados do parceiro 2 no casal
        casal.setNomeParceiro2(null);
        casal.setEmailConviteParceiro2(null);
        casal.setConviteAceito(false);
        
        casalRepository.save(casal);
    }
    
    public void atualizarNomes(Long casalId, String nomeParceiro1, String nomeParceiro2) {
        Casal casal = casalRepository.findById(casalId)
            .orElseThrow(() -> new RuntimeException("Casal não encontrado"));
        
        casal.setNomeParceiro1(nomeParceiro1);
        casal.setNomeParceiro2(nomeParceiro2);
        
        casalRepository.save(casal);
    }
    
    public void definirMeta(Long casalId, Double metaMensal) {
        Casal casal = casalRepository.findById(casalId)
            .orElseThrow(() -> new RuntimeException("Casal não encontrado"));
        
        casal.setMetaMensal(metaMensal);
        
        casalRepository.save(casal);
    }
    
    public Map<String, Object> buscarEstatisticas(Long casalId, int mes, int ano) {
        Casal casal = casalRepository.findById(casalId)
            .orElseThrow(() -> new RuntimeException("Casal não encontrado"));
        
        // Calcular primeiro e último dia do mês
        LocalDate primeiroDia = LocalDate.of(ano, mes, 1);
        LocalDate ultimoDia = primeiroDia.withDayOfMonth(primeiroDia.lengthOfMonth());
        
        // Buscar todas as despesas do mês
        List<Despesa> despesas = despesaRepository.findByCasalIdAndDataTransacaoBetween(
            casalId, primeiroDia, ultimoDia
        );
        
        // Calcular totais por parceiro (convertendo BigDecimal pra double)
        double totalParceiro1 = despesas.stream()
            .filter(d -> "PARCEIRO_1".equals(d.getResponsavel()))
            .mapToDouble(d -> d.getValor().doubleValue())
            .sum();

        double totalParceiro2 = despesas.stream()
            .filter(d -> "PARCEIRO_2".equals(d.getResponsavel()))
            .mapToDouble(d -> d.getValor().doubleValue())
            .sum();

        double totalCompartilhado = despesas.stream()
            .filter(d -> "COMPARTILHADA".equals(d.getResponsavel()))
            .mapToDouble(d -> d.getValor().doubleValue())
            .sum();

        double totalGeral = despesas.stream()
            .mapToDouble(d -> d.getValor().doubleValue())
            .sum();
        
        // Calcular saldo (meta - gasto)
        double metaMensal = casal.getMetaMensal() != null ? casal.getMetaMensal() : 0.0;
        double saldo = metaMensal - totalGeral;
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalParceiro1", totalParceiro1);
        stats.put("totalParceiro2", totalParceiro2);
        stats.put("totalCompartilhado", totalCompartilhado);
        stats.put("totalGeral", totalGeral);
        stats.put("metaMensal", metaMensal);
        stats.put("saldo", saldo);
        stats.put("nomeParceiro1", casal.getNomeParceiro1() != null ? casal.getNomeParceiro1() : "Parceiro 1");
        stats.put("nomeParceiro2", casal.getNomeParceiro2() != null ? casal.getNomeParceiro2() : "Parceiro 2");
        
        return stats;
    }
}