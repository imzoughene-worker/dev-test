import { Component, DestroyRef, OnInit, TemplateRef } from '@angular/core';
import {
  AffiliationFilter,
  IAffiliationFilter,
  MultiGraphDto,
  PieChartDto,
  PopulationClientClient,
} from '@portals/client-reporting';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { PopulationClientService } from '../../services/population-client.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import dayjs from 'dayjs';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { EnvironmentService } from '@portals/base/core/core-component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';

import { PieChartComponent } from '../../../charts/pie-chart/pie-chart.component';
import { MultigraphChartComponent } from '../../../charts/multigraph-chart/multigraph-chart.component';

interface IFilterRequest {
  filters: IAffiliationFilter;
}

@Component({
    selector: 'portals-third-tab',
    templateUrl: './third-tab.component.html',
    styleUrls: ['./third-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, PieChartComponent, MultigraphChartComponent]
})
export class ThirdTabComponent implements OnInit {
  private isExterne: boolean;

  constructor(
    private popClient: PopulationClientClient,
    private fb: UntypedFormBuilder,
    public populationClientService: PopulationClientService,
    private env: EnvironmentService,
    private windowService: WindowService,
    private destroyRef: DestroyRef
  ) {
    this.isExterne = this.env.isSouscripteurClient;
    if (this.isExterne) {
      this.formFilter.controls['startingDate'].setValue(dayjs().set('month', 0).set('date', 1).toDate());
    }
  }

  editMode = false;
  hide: BehaviorSubject<boolean>[] = [
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

  today = dayjs().toDate();
  lastYear = dayjs('2022-01-01').toDate();

  public formFilter: UntypedFormGroup = this.fb.group({
    startingDate: [this.lastYear],
    endDate: [this.today],
    souscripteur: [[]],
    police: [[]],
    statut: [[]],
    numeroAdhesion: [[]],
    anneeAdhesion: [[]],
    trimestreAdhesion: [[]],
  });

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.formFilter.get(name);
  }

  ngOnInit(): void {
    this.populationClientService.affiliationFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: IAffiliationFilter | null) => {
        if (queryObject == null) return;
        const query = {
          filters: queryObject,
        };

        this.updateRepartitionParSex(query);
        this.updateRepartitionPopulationMajeurMineurPieChart(query);
        this.updateNombreLienParPolice(query);
      });
  }

  //repartition par sexe
  repartitionParSexeIsLoading = false;
  repartitionParSexePieChart: PieChartDto | null = null;

  updateRepartitionParSex(query: IFilterRequest): void {
    this.popClient
      .getRepartitionPopulationParSexe('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.repartitionParSexeIsLoading = true)),
        finalize(() => (this.repartitionParSexeIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.repartitionParSexePieChart = s;
      });
  }

  //repartitionPopulationMajeurMineur
  repartitionPopulationMajeurMineurIsLoading = false;
  repartitionPopulationMajeurMineurPieChart: PieChartDto | null = null;

  updateRepartitionPopulationMajeurMineurPieChart(query: IFilterRequest): void {
    this.popClient
      .getRepartitionPopulationMajeurMineur('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.repartitionPopulationMajeurMineurIsLoading = true)),
        finalize(() => (this.repartitionPopulationMajeurMineurIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.repartitionPopulationMajeurMineurPieChart = s;
      });
  }

  //repartitionPopulationMajeurMineur
  nombreLienParPoliceIsLoading = false;
  nombreLienParPoliceMultiGraph: MultiGraphDto | null = null;

  updateNombreLienParPolice(query: IFilterRequest): void {
    this.popClient
      .getNombreLienParPolice('1.0', AffiliationFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.nombreLienParPoliceIsLoading = true)),
        finalize(() => (this.nombreLienParPoliceIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.nombreLienParPoliceMultiGraph = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
