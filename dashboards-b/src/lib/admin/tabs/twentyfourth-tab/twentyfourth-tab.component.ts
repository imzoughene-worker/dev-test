import { AfterViewInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AdminClient, AdminFilter, GraphDto, IAdminFilter, MetricDto } from '@portals/client-reporting';
import { BehaviorSubject, finalize, take, tap } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { WindowService } from '@progress/kendo-angular-dialog';
import { MenuItem } from '@progress/kendo-angular-menu';
import { KENDO_TILELAYOUT, TileLayoutComponent } from '@progress/kendo-angular-layout';
import { fullscreenIcon } from '@progress/kendo-svg-icons';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';

import { GraphChartComponent } from '../../../charts/graph-chart/graph-chart.component';
import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';

interface IFilterRequest {
  filters: IAdminFilter;
}

@Component({
    selector: 'portals-twentyfourth-tab',
    templateUrl: './twentyfourth-tab.component.html',
    styleUrls: ['./twentyfourth-tab.component.scss'],
    imports: [KENDO_TILELAYOUT, KENDO_BUTTON, GraphChartComponent, MetricChartComponent]
})
export class TwentyfourthTabComponent implements OnInit, AfterViewInit {
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 3 }).map((x) => new BehaviorSubject<boolean>(false));
  @ViewChild('tileLayout') tileLayout: TileLayoutComponent | undefined;

  suiviEtatDossierAdminIsLoading = false;
  suiviEtatDossierAdminIsGraph: GraphDto | null = null;

  totalDossierSaisiAdminIsLoading = false;
  totalDossierSaisiAdminIsMetric: MetricDto | null = null;

  dossierSaisiParJourParAgentIsLoading = false;
  dossierSaisiParJourParAgentGraph: GraphDto | null = null;

  editMode = false;

  constructor(
    private adminClient: AdminClient,
    public adminService: AdminService,
    private windowService: WindowService
  ) {}

  ngAfterViewInit() {}

  ngOnInit(): void {
    this.adminService.adminFilters$.subscribe((queryObject: IAdminFilter | null) => {
      if (queryObject == null) return;
      const query = {
        filters: queryObject,
      };
      this.updateSuiviEtatDossierAdmin(query);
      this.updateTotalDossierSaisiAdmin(query);
      this.updateDossierSaisiParJourParAgent(query);
    });
  }

  menuItems: MenuItem[] = [
    {
      text: 'Masquer/Afficher',
      icon: 'eye',
    },
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

  updateSuiviEtatDossierAdmin(query: IFilterRequest): void {
    this.adminClient
      .getSuiviEtatDossierAdmin('1.0', AdminFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.suiviEtatDossierAdminIsLoading = true)),
        finalize(() => (this.suiviEtatDossierAdminIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.suiviEtatDossierAdminIsGraph = s;
      });
  }

  updateTotalDossierSaisiAdmin(query: IFilterRequest): void {
    this.adminClient
      .getTotalDossierSaisiAdmin('1.0', AdminFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.totalDossierSaisiAdminIsLoading = true)),
        finalize(() => (this.totalDossierSaisiAdminIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalDossierSaisiAdminIsMetric = s;
      });
  }

  updateDossierSaisiParJourParAgent(query: IFilterRequest): void {
    this.adminClient
      .getDossierSaisiParJourParAgent('1.0', AdminFilter.fromJS(query.filters))
      .pipe(
        tap(() => (this.dossierSaisiParJourParAgentIsLoading = true)),
        finalize(() => (this.dossierSaisiParJourParAgentIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.dossierSaisiParJourParAgentGraph = s;
      });
  }

  protected readonly fullscreenIcon = fullscreenIcon;
}
