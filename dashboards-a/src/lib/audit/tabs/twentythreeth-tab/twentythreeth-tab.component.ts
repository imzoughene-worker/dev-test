import { Component, OnInit, TemplateRef } from '@angular/core';
import { AuditClient, AuditFilter, IAuditFilter, MetricDto } from '@portals/client-reporting';
import { BehaviorSubject, finalize, take, tap } from 'rxjs';
import { AuditService } from '../../services/audit.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';

import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';

interface IFilterRequest {
  filters: IAuditFilter;
}

@Component({
    selector: 'portals-twentythreeth-tab',
    templateUrl: './twentythreeth-tab.component.html',
    styleUrls: ['./twentythreeth-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, MetricChartComponent]
})
export class TwentythreethTabComponent implements OnInit {
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 5 }).map((x) => new BehaviorSubject<boolean>(false));

  constructor(
    private auditClient: AuditClient,
    public auditService: AuditService,
    private windowService: WindowService
  ) {}

  editMode = false;

  expandCard(container: TemplateRef<any>, text: string) {
    this.windowService.open({
      height: 600,
      width: 1000,
      title: text,
      state: 'maximized',
      resizable: false,
      content: container,
    });
  }

  ngOnInit(): void {
    this.auditService.auditFilters$.subscribe((queryObject: IAuditFilter | null) => {
      if (queryObject == null) return;
      const query = {
        filters: queryObject,
      };
      this.updateTotalDossierSaisi(query);
      this.updateTotalDossierRecu(query);
      this.updateGapDossierSaisi(query);
      this.updateDossierSaisiToday(query);
      this.updateDossierRecuToday(query);
    });
  }

  //totalDossierRecu
  totalDossierRecuAuditIsLoading = false;
  totalDossierRecuAuditIsMetric: MetricDto | null = null;

  updateTotalDossierRecu(query: IFilterRequest): void {
    this.auditClient
      .getTotalDossierRecuAudit('1.0', AuditFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.totalDossierRecuAuditIsLoading = true)),
        finalize(() => (this.totalDossierRecuAuditIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalDossierRecuAuditIsMetric = s;
      });
  }

  //totalDossierSaisi
  totalDossierSaisiAuditIsLoading = false;
  totalDossierSaisiAuditIsMetric: MetricDto | null = null;

  updateTotalDossierSaisi(query: IFilterRequest): void {
    this.auditClient
      .getTotalDossierSaisiLotAudit('1.0', AuditFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.totalDossierSaisiAuditIsLoading = true)),
        finalize(() => (this.totalDossierSaisiAuditIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalDossierSaisiAuditIsMetric = s;
      });
  }

  //gapDossierSaisie
  gapDossierSaisieIsLoading = false;
  gapDossierSaisieMetric: MetricDto | null = null;

  updateGapDossierSaisi(query: IFilterRequest): void {
    this.auditClient
      .getGapDossierSaisie('1.0', AuditFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.gapDossierSaisieIsLoading = true)),
        finalize(() => (this.gapDossierSaisieIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.gapDossierSaisieMetric = s;
      });
  }

  //totalDossierSaisiAudit
  totalDossierSaisiAuditTodayIsLoading = false;
  totalDossierSaisiAuditTodayMetric: MetricDto | null = null;

  updateDossierSaisiToday(query: IFilterRequest): void {
    this.auditClient
      .getTotalDossierSaisiSinistreAuditToday('1.0', AuditFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.totalDossierSaisiAuditTodayIsLoading = true)),
        finalize(() => (this.totalDossierSaisiAuditTodayIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalDossierSaisiAuditTodayMetric = s;
      });
  }

  //repartition par lien
  totalDossierRecuAuditTodayIsLoading = false;
  totalDossierRecuAuditTodayMetric: MetricDto | null = null;

  updateDossierRecuToday(query: IFilterRequest): void {
    this.auditClient
      .getTotalDossierRecuAuditToday('1.0', AuditFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.totalDossierRecuAuditTodayIsLoading = true)),
        finalize(() => (this.totalDossierRecuAuditTodayIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalDossierRecuAuditTodayMetric = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
