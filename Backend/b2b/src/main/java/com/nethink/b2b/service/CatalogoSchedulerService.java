package com.nethink.b2b.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class CatalogoSchedulerService {

    private final SyncCatalogoService syncService;

    public CatalogoSchedulerService(SyncCatalogoService syncService) {
        this.syncService = syncService;
    }

    @Scheduled(fixedDelayString = "#{@configService.getValor('SYNC_INTERVAL')}")
    public void sincronizarAutomatico() {
        syncService.sincronizarTodos();
    }
}