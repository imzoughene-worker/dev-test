import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, take } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LineChartDto } from '@portals/client-identity';
import {
  DashboardReclamationClient,
  DashboardSinistreClient,
  FeuilleDeSoinCountStatus,
  ReclamationCountStatus,
  TypeDeSoinCountStatus,
} from '@portals/client-mobile';
import { KENDO_CARD } from '@progress/kendo-angular-layout';
import { KENDO_PROGRESSBAR } from '@progress/kendo-angular-progressbar';
import { AsyncPipe } from '@angular/common';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { KENDO_CHART } from '@progress/kendo-angular-charts';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss'],
  imports: [KENDO_CARD, KENDO_PROGRESSBAR, AsyncPipe, KENDO_BUTTON, KENDO_CHART],
})
export class GeneralComponent implements OnInit {
  FeuilleDeSoinCountStatus: FeuilleDeSoinCountStatus | null = null;
  FeuilleDeSoinCountStatusLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  TypeDeSoinCount: TypeDeSoinCountStatus | null = null;
  TypeDeSoinCountLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  FeuilleDeSoinTimeline: LineChartDto | null = null;
  FeuilleDeSoinTimelineLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  ReclamationCountStatus: ReclamationCountStatus | null = null;
  ReclamationCountStatusLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  ReclamationTimeline: LineChartDto | null = null;
  ReclamationTimelineLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  constructor(
    private sinistreDashboards: DashboardSinistreClient,
    private reclamationDashboards: DashboardReclamationClient
  ) {}

  ngOnInit(): void {
    this.sinistreDashboards
      .getStatusCount('1.0')
      .pipe(
        finalize(() => this.FeuilleDeSoinCountStatusLoading.next(false)),
        take(1)
      )
      .subscribe((result) => (this.FeuilleDeSoinCountStatus = result));

    this.sinistreDashboards
      .getTypeDeSoinCount('1.0')
      .pipe(
        finalize(() => this.TypeDeSoinCountLoading.next(false)),
        take(1)
      )
      .subscribe((result) => (this.TypeDeSoinCount = result));

    this.sinistreDashboards
      .getTimeLineStatus('1.0')
      .pipe(
        finalize(() => this.FeuilleDeSoinTimelineLoading.next(false)),
        take(1)
      )
      .subscribe((result) => (this.FeuilleDeSoinTimeline = result));

    this.reclamationDashboards
      .getCountStatus('1.0')
      .pipe(
        finalize(() => this.ReclamationCountStatusLoading.next(false)),
        take(1)
      )
      .subscribe((result) => (this.ReclamationCountStatus = result));

    this.reclamationDashboards
      .getTimeLineStatus('1.0')
      .pipe(
        finalize(() => this.ReclamationTimelineLoading.next(false)),
        take(1)
      )
      .subscribe((result) => (this.ReclamationTimeline = result));
  }
}
