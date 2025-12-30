import { Component, OnInit, TemplateRef } from '@angular/core';
import { GraphDto, ISuiviSinistreFilters, SuiviSinistreClient, SuiviSinistreFilters } from '@portals/client-reporting';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { SuiviSinistreService } from '../../services/suivi-sinistre.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';

import { GraphChartComponent } from '../../../charts/graph-chart/graph-chart.component';

interface IFilterRequest {
  filters: ISuiviSinistreFilters;
}

@Component({
    selector: 'portals-thirteenth-tab',
    templateUrl: './thirteenth-tab.component.html',
    styleUrls: ['./thirteenth-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, GraphChartComponent]
})
export class ThirteenthTabComponent implements OnInit {
  constructor(
    private suiviSinistreClient: SuiviSinistreClient,
    public suiviSinistreService: SuiviSinistreService,
    private windowService: WindowService
  ) {}

  editMode = false;
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 4 }).map((x) => new BehaviorSubject<boolean>(false));

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
    this.suiviSinistreService.suiviSinistreFilters$.subscribe((queryObject: ISuiviSinistreFilters | null) => {
      if (queryObject == null) return;
      const query = {
        filters: queryObject,
      };
      this.updateRubriqueParQuantite(query);
      this.updateRubriqueParMontantEngage(query);
      this.updateTopEsConsulteParQuantite(query);
      this.updateTopEsConsultesParMontantEngage(query);
    });
  }

  //RubriqueParQuantite
  rubriqueParQuantiteIsLoading = false;
  rubriqueParQuantiteGraph: GraphDto | null = null;

  updateRubriqueParQuantite(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getRubriqueParQuantite('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.rubriqueParQuantiteIsLoading = true)),
        finalize(() => (this.rubriqueParQuantiteIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.rubriqueParQuantiteGraph = s;
      });
  }

  //RubriqueParMontantEngage
  rubriqueParMontantEngageIsLoading = false;
  rubriqueParMontantEngageGraph: GraphDto | null = null;

  updateRubriqueParMontantEngage(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getRubriqueParMontantEngage('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.rubriqueParMontantEngageIsLoading = true)),
        finalize(() => (this.rubriqueParMontantEngageIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.rubriqueParMontantEngageGraph = s;
      });
  }

  //TopEsConsulteParQuantite
  topEsConsulteParQuantiteIsLoading = false;
  topEsConsulteParQuantiteGraph: GraphDto | null = null;

  updateTopEsConsulteParQuantite(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTopEsConsulteParQuantite('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.topEsConsulteParQuantiteIsLoading = true)),
        finalize(() => (this.topEsConsulteParQuantiteIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.topEsConsulteParQuantiteGraph = s;
      });
  }

  //TopEsConsultesParMontantEngage
  topEsConsultesParMontantEngageIsLoading = false;
  topEsConsultesParMontantEngageGraph: GraphDto | null = null;

  updateTopEsConsultesParMontantEngage(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTopEsConsultesParMontantEngage('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.topEsConsultesParMontantEngageIsLoading = true)),
        finalize(() => (this.topEsConsultesParMontantEngageIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.topEsConsultesParMontantEngageGraph = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
