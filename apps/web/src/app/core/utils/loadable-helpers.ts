import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';
import { Loadable } from '../models/loadable.model';

export function toLoadable<T>(
  source$: Observable<T>,
  errorMessage: string
): Observable<Loadable<T>> {
  return source$.pipe(
    map(data => ({
      loading: false,
      data,
      error: null
    })),
    startWith({
      loading: true,
      data: null,
      error: null
    }),
    catchError(() =>
      of({
        loading: false,
        data: null,
        error: errorMessage
      })
    ),
    shareReplay(1)
  );
}