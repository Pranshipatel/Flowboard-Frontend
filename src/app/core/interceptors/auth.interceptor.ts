import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);

  const token  = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  let authReq = req;

  if (token) {

    const isFormData = req.body instanceof FormData;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'X-User-Id': userId ?? ''
    };

    // Avoid setting content-type for FormData
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    authReq = req.clone({
      setHeaders: headers
    });
  }

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {

      // Redirect to the guest page on unauthorized
      if (err.status === 401) {
        if (!req.url.includes('/auth/login')) {
          localStorage.clear();
          router.navigate(['/guest']);
        }
      }

      return throwError(() => err);
    })
  );
};
