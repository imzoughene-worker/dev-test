import { Component, OnInit, TemplateRef } from '@angular/core';
import {
  GraphDto,
  ISuiviSinistreFilters,
  PieChartDto,
  SuiviSinistreClient,
  SuiviSinistreFilters,
} from '@portals/client-reporting';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { SuiviSinistreService } from '../../services/suivi-sinistre.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';

import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { PieChartComponent } from '../../../charts/pie-chart/pie-chart.component';
import { GraphChartComponent } from '../../../charts/graph-chart/graph-chart.component';
import { AppModeService } from '@portals/base/core/shared-services';

interface IFilterRequest {
  filters: ISuiviSinistreFilters;
}

@Component({
    selector: 'portals-eleventh-tab',
    templateUrl: './eleventh-tab.component.html',
    styleUrls: ['./eleventh-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, PieChartComponent, GraphChartComponent]
})
export class EleventhTabComponent implements OnInit {
  constructor(
    private suiviSinistreClient: SuiviSinistreClient,
    public suiviSinistreService: SuiviSinistreService,
    private windowService: WindowService,
    private appModeService: AppModeService
  ) {}

  editMode = false;
  appMode = this.appModeService.appMode;
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 2 }).map((x) => new BehaviorSubject<boolean>(false));

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
      this.updateRepartitionParTypeDeSoin(query);
      this.updateMontantMoyenRembourseParTypeDeDossier(query);
    });
  }

  //RepartitionParTypeDeSoin
  repartitionParTypeDeSoinIsLoading = false;
  repartitionParTypeDeSoinPie: PieChartDto | null = null;

  updateRepartitionParTypeDeSoin(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getRepartitionParTypeDeSoin('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.repartitionParTypeDeSoinIsLoading = true)),
        finalize(() => (this.repartitionParTypeDeSoinIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.repartitionParTypeDeSoinPie = s;
      });
  }

  //MontantMoyenRembourseParTypeDeDossier
  montantMoyenRembourseParTypeDeDossierIsLoading = false;
  montantMoyenRembourseParTypeDeDossierGraph: GraphDto | null = null;

  updateMontantMoyenRembourseParTypeDeDossier(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getMontantMoyenRembourseParTypeDeDossier(
        '1.0',
        SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] })
      )
      .pipe(
        tap(() => (this.montantMoyenRembourseParTypeDeDossierIsLoading = true)),
        finalize(() => (this.montantMoyenRembourseParTypeDeDossierIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.montantMoyenRembourseParTypeDeDossierGraph = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
