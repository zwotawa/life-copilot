import { Component } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map, shareReplay, startWith } from 'rxjs/operators';

import { BackendVersionInfo } from 'src/app/core/models/backend-version.model';
import { Loadable } from 'src/app/core/models/loadable.model';
import {
  AuthDiagnosticsSnapshot,
  DiagnosticsService
} from 'src/app/core/services/diagnostics.service';
import { toLoadable } from 'src/app/core/utils/loadable-helpers';

interface DiagnosticsViewModel {
  backendVersionState: Loadable<BackendVersionInfo>;
  backendVersion: BackendVersionInfo | null;
  authSnapshot: AuthDiagnosticsSnapshot;
  apiReachable: boolean | null;
  pageLoading: boolean;
  pageErrorMessages: string[];
  currentUrl: string;
  browserTime: string;
}

@Component({
  selector: 'app-diagnostics-page',
  templateUrl: './diagnostics-page.component.html',
  styleUrls: ['./diagnostics-page.component.scss']
})
export class DiagnosticsPageComponent {
  private readonly backendVersionState$: Observable<Loadable<BackendVersionInfo>> =
    toLoadable(this.diagnosticsService.getBackendVersion(), 'Could not load backend diagnostics.');
    
  public readonly vm$: Observable<DiagnosticsViewModel> = combineLatest([
    this.backendVersionState$,
    this.diagnosticsService.authSnapshot$
  ]).pipe(
    map(([backendVersionState, authSnapshot]) => {
      const pageErrorMessages = [
        backendVersionState.error
      ].filter((message): message is string => !!message);

      return {
        backendVersionState,
        backendVersion: backendVersionState.data,
        authSnapshot,
        apiReachable: backendVersionState.data ? true : backendVersionState.loading ? null : false,
        pageLoading: backendVersionState.loading,
        pageErrorMessages,
        currentUrl: window.location.href,
        browserTime: new Date().toISOString()
      };
    }),
    shareReplay(1)
  );

  constructor(
    private readonly diagnosticsService: DiagnosticsService
  ) {}
}