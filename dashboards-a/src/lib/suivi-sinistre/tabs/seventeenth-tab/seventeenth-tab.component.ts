import { AsyncPipe } from '@angular/common';
import { Component, computed, DestroyRef, Inject, OnInit, TemplateRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { UntypedFormControl } from '@angular/forms';
import {
  exportSceneBlob,
  ITrigramme,
  MyUserService,
  RoleService,
  toDateFormat,
  TRIGRAMME,
} from '@portals/base/core/core-component';
import { GridPersistanceDirective } from '@portals/base/core/directives';
import { DateLongPipe } from '@portals/base/core/pipes';
import { RoleEnum } from '@portals/client-identity';
import {
  DateParameters,
  ISuiviSinistreFilters,
  MetricDto,
  SuiviSinistreClient,
  SuiviSinistreFilters,
} from '@portals/client-reporting';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { WindowService } from '@progress/kendo-angular-dialog';
import { DataStateChangeEvent, KENDO_GRID } from '@progress/kendo-angular-grid';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { fileExcelIcon, fullscreenIcon } from '@progress/kendo-svg-icons';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';
import { DashboardFields } from '../../../dashboard-model';
import { ContreVisiteDelaiDepasseService } from '../../services/contre-visite-delai-depasse.data.service';
import { SuiviContreVisiteService } from '../../services/suivi-contre-visite.data.service';
import { SuiviSinistreService } from '../../services/suivi-sinistre.service';
//interface non utilisée
// interface IFilterRequest {
//   filters: ISuiviSinistreFilters
// }

@Component({
  selector: 'portals-seventeenth-tab',
  templateUrl: './seventeenth-tab.component.html',
  styleUrls: ['./seventeenth-tab.component.scss'],
  imports: [
    KENDO_TILELAYOUT,
    KENDO_BUTTON,
    MetricChartComponent,
    KENDO_GRID,
    GridPersistanceDirective,
    AsyncPipe,
    DateLongPipe,
  ],
})
export class SeventeenthTabComponent implements OnInit {
  constructor(
    public suiviSinistreService: SuiviSinistreService,
    public suiviSinistreClient: SuiviSinistreClient,
    public suiviContreVisiteService: SuiviContreVisiteService,
    public contreVisiteDelaiDepasseService: ContreVisiteDelaiDepasseService,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    private windowService: WindowService,
    private destroyRef: DestroyRef,
    private myUser: MyUserService,
    private roleService: RoleService
  ) {}

  editMode = false;
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 4 }).map((x) => new BehaviorSubject<boolean>(false));
  PGD = toSignal(this.myUser.hasLevel('PGD', 2));
  CDA = toSignal(this.myUser.hasLevel('CDA', 2));
  PSD = toSignal(this.myUser.hasLevel('PSD', 2));

  hasAccess = computed(() => {
    switch (this.roleService.currentRole()) {
      case RoleEnum.Intranet:
        return this.CDA();
      case RoleEnum.Gestionnaire:
        return this.PGD();
      case RoleEnum.Souscripteur:
        return this.PSD();
      default:
        return false;
    }
  });
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

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.suiviSinistreService.formFilter.get(name);
  }

  ngOnInit(): void {
    this.suiviContreVisiteService.reset();
    this.contreVisiteDelaiDepasseService.reset();
    this.suiviSinistreService.suiviSinistreFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: ISuiviSinistreFilters | null) => {
        if (queryObject == null) return;
        //variable non utilisée
        // let query = {
        //   filters: queryObject
        // };
        this.updateTotalContreVisite(queryObject);
        this.updateTotalContreVisiteDelaiDepasse(queryObject);
        this.updateSuiviContreVisite(queryObject);
        this.updateContreVisiteDelaiDepasse(queryObject);
      });
  }

  //TotalContreVisite
  totalContreVisiteIsLoading = false;
  totalContreVisiteMetric: MetricDto | null = null;

  updateTotalContreVisite(query: ISuiviSinistreFilters): void {
    this.suiviSinistreClient
      .getTotalContreVisite('1.0', SuiviSinistreFilters.fromJS({ ...query, etatClients: [] }))
      .pipe(
        tap(() => (this.totalContreVisiteIsLoading = true)),
        finalize(() => (this.totalContreVisiteIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalContreVisiteMetric = s;
      });
  }

  //TotalContreVisiteDelaiDepasse
  totalContreVisiteDelaiDepasseIsLoading = false;
  totalContreVisiteDelaiDepasseMetric: MetricDto | null = null;

  updateTotalContreVisiteDelaiDepasse(query: ISuiviSinistreFilters): void {
    this.suiviSinistreClient
      .getTotalContreVisiteDelaiDepasse('1.0', SuiviSinistreFilters.fromJS({ ...query, etatClients: [] }))
      .pipe(
        tap(() => (this.totalContreVisiteDelaiDepasseIsLoading = true)),
        finalize(() => (this.totalContreVisiteDelaiDepasseIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalContreVisiteDelaiDepasseMetric = s;
      });
  }

  //DEBUT GRILLE CONTRE VISITE

  public raffrachirSuiviContreVisite(): void {
    this.suiviContreVisiteService.refresh(this.getFilter());
  }

  public dataStateChangeSuiviContreVisite(state: DataStateChangeEvent): void {
    this.suiviContreVisiteService.state = state;
    this.suiviContreVisiteService.read(this.getFilter());
  }

  updateSuiviContreVisite(query: ISuiviSinistreFilters): void {
    this.suiviContreVisiteService.refresh(query);
  }

  isExporting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportContreVisite(): void {
    const exportContreVisiteQuery = SuiviSinistreFilters.fromJS(this.getFilter());
    this.isExporting.next(true);
    this.suiviSinistreClient
      .exportContreVisite('1.0', exportContreVisiteQuery)
      .pipe(
        take(1),
        finalize(() => this.isExporting.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE CONTRE VISITE

  //DEBUT GRILLE CONTRE VISITE DELAI DEPASSE

  public raffrachirSContreVisiteDelaiDepasse(): void {
    this.contreVisiteDelaiDepasseService.refresh(this.getFilter());
  }

  public dataStateChangeContreVisiteDelaiDepasse(state: DataStateChangeEvent): void {
    this.contreVisiteDelaiDepasseService.state = state;
    this.contreVisiteDelaiDepasseService.read(this.getFilter());
  }

  updateContreVisiteDelaiDepasse(query: ISuiviSinistreFilters): void {
    this.contreVisiteDelaiDepasseService.refresh(query);
  }

  isExporting2: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportContreVisiteDepasse(): void {
    const exportContreVisiteDepasseQuery = SuiviSinistreFilters.fromJS(this.getFilter());
    this.isExporting2.next(true);
    this.suiviSinistreClient
      .exportContreVisiteDepasse('1.0', exportContreVisiteDepasseQuery)
      .pipe(
        take(1),
        finalize(() => this.isExporting2.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE CONTRE VISITE DELAI DEPASSE

  public getFilter(): ISuiviSinistreFilters {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value!);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value!);

    if (this.suiviSinistreService.filterForToday.getValue()) {
      startDate = new Date();
      endDate = new Date();
    }
    return <ISuiviSinistreFilters>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      numeroLots: this.getField(DashboardFields.NumeroLot).value,
      polices: this.getField(DashboardFields.Police).value,
      adherents: this.getField(DashboardFields.Adherent).value,
      numeroDeclarations: this.getField(DashboardFields.NumeroDeclaration).value,
      etats: this.getField(DashboardFields.Etat).value,
      etatClients: this.getField(DashboardFields.EtatClient).value,
      filtrePolice: this.trigramme.authority === 'EBM' ? this.suiviSinistreService.filterByPolice.getValue() : true,
      filtreNC: this.trigramme.authority === 'AZM' ? this.suiviSinistreService.filterByNextcare.getValue() : false,
      dateParameters: <DateParameters>{
        startingDate: startDate,
        endDate: endDate,
      },
    };
  }

  protected readonly fileExcelIcon = fileExcelIcon;
  protected readonly fullscreenIcon = fullscreenIcon;
}
