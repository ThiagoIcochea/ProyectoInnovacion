// Frontend route guard: blocks private app routes when there is no active token.
import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router, UrlTree } from '@angular/router';
import { APP_ROUTE_PATHS, APP_STORAGE_KEYS } from '../constants/app.constants';

const hasToken = (): boolean => {
  const token = localStorage.getItem(APP_STORAGE_KEYS.token);

  return !!token && token !== 'null' && token.trim() !== '';
};

const canAccessPrivateRoute = (): boolean | UrlTree => {
  const router = inject(Router);

  if (hasToken()) {
    return true;
  }

  return router.createUrlTree([APP_ROUTE_PATHS.login]);
};

export const authGuard: CanActivateFn = () => canAccessPrivateRoute();

export const authChildGuard: CanActivateChildFn = () => canAccessPrivateRoute();
