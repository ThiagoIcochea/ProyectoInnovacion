package com.nethink.b2b.service;

import com.nethink.b2b.entity.EmpresaCompradora;
import com.nethink.b2b.repository.EmpresaCompradoraRepository;
import com.nethink.b2b.service.EmpresaCompradoraService;

import org.springframework.stereotype.Service;

@Service
public class EmpresaCompradoraServiceImpl
        implements EmpresaCompradoraService {

    private final EmpresaCompradoraRepository empresaRepo;

    public EmpresaCompradoraServiceImpl(
            EmpresaCompradoraRepository empresaRepo
    ) {
        this.empresaRepo = empresaRepo;
    }

    @Override
    public EmpresaCompradora registrar(
            EmpresaCompradora empresa
    ) {

        return empresaRepo.save(empresa);
    }
}