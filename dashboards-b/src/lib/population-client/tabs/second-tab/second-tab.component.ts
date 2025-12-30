import { Component, DestroyRef, OnInit, TemplateRef } from '@angular/core';
import {
  AffiliationFilter,
  GraphDto,
  IAffiliationFilter,
  MetricDto,
  PopulationClientClient,
} from '@portals/client-reporting';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { PopulationClientService } from '../../services/population-client.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';

import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';
import { GraphChartComponent } from '../../../charts/graph-chart/graph-chart.component';

interface IFilterRequest {
  filters: IAffiliationFilter;
}

@Component({
    selector: 'portals-second-tab',
    templateUrl: './second-tab.component.html',
    styleUrls: ['./second-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, MetricChartComponent, GraphChartComponent]
})
export class SecondTabComponent implements OnInit {
  constructor(
    private popClient: PopulationClientClient,
    public populationClientService: PopulationClientService,
    private windowService: WindowService,
    private destroyRef: DestroyRef
  ) {}

  editMode = false;
  hide: BehaviorSubject<boolean>[] = [
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
    new BehaviorSubject<boolean>(false),
  ];

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
    this.populationClientService.affiliationFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: IAffiliationFilter | null) => {
        if (queryObject == null) return;
        const query = {
          filters: queryObject,
        };
        this.updateTotalMobiliteReduiteMetric(query);
        this.updateAgeMoyenAdherentMetric(query);
        this.updateAgeMaxAdherentMetric(query);
        this.updateMobiliteReduiteParTrancheAge(query);
      });
  }

  mobiliteReduiteParTrancheAgeIsLoading = false;
  mobiliteReduiteParTrancheAgeGraph: GraphDto | null = null;

  updateMobiliteReduiteParTrancheAge(query: IFilterRequest): void {
    this.popClient
      .getMobiliteReduiteParTrancheAge('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.mobiliteReduiteParTrancheAgeIsLoading = true)),
        finalize(() => (this.mobiliteReduiteParTrancheAgeIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.mobiliteReduiteParTrancheAgeGraph = s;
      });
  }

  //totalMobiliteReduite
  totalMobiliteReduiteIsLoading = false;
  totalMobiliteReduiteMetric: MetricDto | null = null;

  updateTotalMobiliteReduiteMetric(query: IFilterRequest): void {
    this.popClient
      .getTotalMobiliteReduite('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.totalMobiliteReduiteIsLoading = true)),
        finalize(() => (this.totalMobiliteReduiteIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalMobiliteReduiteMetric = s;
      });
  }

  //ageMoyenAdherent
  ageMoyenAdherentIsLoading = false;
  ageMoyenAdherentMetric: MetricDto | null = null;

  updateAgeMoyenAdherentMetric(query: IFilterRequest): void {
    this.popClient
      .getAgeMoyenAdherent('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.ageMoyenAdherentIsLoading = true)),
        finalize(() => (this.ageMoyenAdherentIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.ageMoyenAdherentMetric = s;
      });
  }

  //ageMaxAdherent
  ageMaxAdherentIsLoading = false;
  ageMaxAdherentMetric: MetricDto | null = null;

  updateAgeMaxAdherentMetric(query: IFilterRequest): void {
    this.popClient
      .getAgeMaxAdherent('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.ageMaxAdherentIsLoading = true)),
        finalize(() => (this.ageMaxAdherentIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.ageMaxAdherentMetric = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
