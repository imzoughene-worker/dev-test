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
    selector: 'portals-twelfth-tab',
    templateUrl: './twelfth-tab.component.html',
    styleUrls: ['./twelfth-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, GraphChartComponent]
})
export class TwelfthTabComponent implements OnInit {
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
      this.updateTopPrestationsParQuantite(query);
      this.updateTopPrestationsParMontantEngage(query);
      this.updateTopMedecinsConsultesParQuantite(query);
      this.updateTopMedecinsConsultesParMontantEngage(query);
    });
  }

  //TopPrestationsParQuantite
  topPrestationsParQuantiteIsLoading = false;
  topPrestationsParQuantiteGraph: GraphDto | null = null;

  updateTopPrestationsParQuantite(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTopPrestationsParQuantite('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.topPrestationsParQuantiteIsLoading = true)),
        finalize(() => (this.topPrestationsParQuantiteIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.topPrestationsParQuantiteGraph = s;
      });
  }

  //TopPrestationsParMontantEngage
  topPrestationsParMontantEngageIsLoading = false;
  topPrestationsParMontantEngageGraph: GraphDto | null = null;

  updateTopPrestationsParMontantEngage(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTopPrestationsParMontantEngage('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.topPrestationsParMontantEngageIsLoading = true)),
        finalize(() => (this.topPrestationsParMontantEngageIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.topPrestationsParMontantEngageGraph = s;
      });
  }

  //TopMedecinsConsultesParQuantite
  topMedecinsConsultesParQuantiteIsLoading = false;
  topMedecinsConsultesParQuantiteGraph: GraphDto | null = null;

  updateTopMedecinsConsultesParQuantite(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTopMedecinsConsultesParQuantite('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.topMedecinsConsultesParQuantiteIsLoading = true)),
        finalize(() => (this.topMedecinsConsultesParQuantiteIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.topMedecinsConsultesParQuantiteGraph = s;
      });
  }

  //TopMedecinsConsultesParMontantEngage
  topMedecinsConsultesParMontantEngageIsLoading = false;
  topMedecinsConsultesParMontantEngageGraph: GraphDto | null = null;

  updateTopMedecinsConsultesParMontantEngage(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTopMedecinsConsultesParMontantEngage(
        '1.0',
        SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] })
      )
      .pipe(
        tap(() => (this.topMedecinsConsultesParMontantEngageIsLoading = true)),
        finalize(() => (this.topMedecinsConsultesParMontantEngageIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.topMedecinsConsultesParMontantEngageGraph = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
