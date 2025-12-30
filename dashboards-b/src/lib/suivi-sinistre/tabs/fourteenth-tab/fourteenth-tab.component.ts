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
    selector: 'portals-fourteenth-tab',
    templateUrl: './fourteenth-tab.component.html',
    styleUrls: ['./fourteenth-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, GraphChartComponent]
})
export class FourteenthTabComponent implements OnInit {
  constructor(
    private suiviSinistreClient: SuiviSinistreClient,
    public suiviSinistreService: SuiviSinistreService,
    private windowService: WindowService
  ) {}

  ngOnInit(): void {
    this.suiviSinistreService.suiviSinistreFilters$.subscribe((queryObject: ISuiviSinistreFilters | null) => {
      if (queryObject == null) return;
      const query = {
        filters: queryObject,
      };
      this.updateTopDesDossiersLesPlusConsommateursParMontantRembourse(query);
      this.updateTopGroupesMaladieParQuantite(query);
      this.updateTopAdhesionLesPlusConsommatricesParMontantRembourse(query);
      this.updateTopSpecialitesParQuantite(query);
    });
  }

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

  //TopDesDossiersLesPlusConsommateursParMontantRembourse
  topDesDossiersLesPlusConsommateursParMontantRembourseIsLoading = false;
  topDesDossiersLesPlusConsommateursParMontantRembourseGraph: GraphDto | null = null;

  updateTopDesDossiersLesPlusConsommateursParMontantRembourse(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTopDesDossiersLesPlusConsommateursParMontantRembourse(
        '1.0',
        SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] })
      )
      .pipe(
        tap(() => (this.topDesDossiersLesPlusConsommateursParMontantRembourseIsLoading = true)),
        finalize(() => (this.topDesDossiersLesPlusConsommateursParMontantRembourseIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.topDesDossiersLesPlusConsommateursParMontantRembourseGraph = s;
      });
  }

  //TopGroupesMaladieParQuantite
  topGroupesMaladieParQuantiteIsLoading = false;
  topGroupesMaladieParQuantiteGraph: GraphDto | null = null;

  updateTopGroupesMaladieParQuantite(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTopGroupesMaladieParQuantite('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.topGroupesMaladieParQuantiteIsLoading = true)),
        finalize(() => (this.topGroupesMaladieParQuantiteIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.topGroupesMaladieParQuantiteGraph = s;
      });
  }

  //TopAdhesionLesPlusConsommatricesParMontantRembourse
  topAdhesionLesPlusConsommatricesParMontantRembourseIsLoading = false;
  topAdhesionLesPlusConsommatricesParMontantRembourseGraph: GraphDto | null = null;

  updateTopAdhesionLesPlusConsommatricesParMontantRembourse(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTopAdhesionLesPlusConsommatricesParMontantRembourse(
        '1.0',
        SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] })
      )
      .pipe(
        tap(() => (this.topAdhesionLesPlusConsommatricesParMontantRembourseIsLoading = true)),
        finalize(() => (this.topAdhesionLesPlusConsommatricesParMontantRembourseIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.topAdhesionLesPlusConsommatricesParMontantRembourseGraph = s;
      });
  }

  //TopSpecialitesParQuantite
  topSpecialitesParQuantiteIsLoading = false;
  topSpecialitesParQuantiteGraph: GraphDto | null = null;

  updateTopSpecialitesParQuantite(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTopSpecialitesParQuantite('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.topSpecialitesParQuantiteIsLoading = true)),
        finalize(() => (this.topSpecialitesParQuantiteIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.topSpecialitesParQuantiteGraph = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
