import { AsyncPipe } from '@angular/common';
import { Component, computed, DestroyRef, Inject, inject, OnInit, TemplateRef } from '@angular/core';
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
import { KENDO_BUTTON, KENDO_CHIP } from '@progress/kendo-angular-buttons';
import { DialogService, WindowService } from '@progress/kendo-angular-dialog';
import { DataStateChangeEvent, KENDO_GRID } from '@progress/kendo-angular-grid';
import { KENDO_INTL } from '@progress/kendo-angular-intl';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { eyeIcon, eyeSlashIcon, fileExcelIcon, fullscreenIcon, menuIcon } from '@progress/kendo-svg-icons';
import { toNumber } from 'lodash';
import { BehaviorSubject, take } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { MetricChartComponent } from '../../../charts/metric-chart/metric-chart.component';
import { DashboardFields } from '../../../dashboard-model';
import { SinistreEnCoursService } from '../../services/sinistre-en-cours.data.service';
import { SinistreLiquideService } from '../../services/sinistre-liquide.data.service';
import { SuiviSinistreService } from '../../services/suivi-sinistre.service';
import { HistoriqueDossierComponent } from './historique-dossier/historique-dossier.component';

interface IFilterRequest {
  filters: ISuiviSinistreFilters;
}

@Component({
  selector: 'portals-fifteenth-tab',
  templateUrl: './fifteenth-tab.component.html',
  styleUrls: ['./fifteenth-tab.component.scss'],
  imports: [
    KENDO_TILELAYOUT,
    KENDO_BUTTON,
    GridPersistanceDirective,
    KENDO_GRID,
    AsyncPipe,
    MetricChartComponent,
    DateLongPipe,
    KENDO_CHIP,
    KENDO_INTL,
  ],
})
export class FifteenthTabComponent implements OnInit {
  constructor(
    public suiviSinistreService: SuiviSinistreService,
    public suiviSinistreClient: SuiviSinistreClient,
    public sinistreEnCoursService: SinistreEnCoursService,
    public sinistreLiquideService: SinistreLiquideService,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public windowService: WindowService,
    private destroyRef: DestroyRef,
    private myUser: MyUserService,
    private roleService: RoleService
  ) {}

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.suiviSinistreService.formFilter.get(name);
  }

  ngOnInit(): void {
    this.sinistreEnCoursService.reset();
    this.sinistreLiquideService.reset();
    this.suiviSinistreService.suiviSinistreFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: ISuiviSinistreFilters | null) => {
        if (queryObject == null) return;
        const query = {
          filters: queryObject,
        };
        this.updateTotalDossierAmbulatoire(query);
        this.updateTotalExecutionAP(query);
        this.updateSuiviTousLesSinistreEnCours(queryObject);
        this.updateSuiviSinistreLiquide(queryObject);
        this.updateTotalPEC(query);
      });
  }

  editMode = false;
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 5 }).map((x) => new BehaviorSubject<boolean>(false));

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

  checkDelaiTraitement(value: string) {
    const modifiedString = toNumber(value?.split('j')[0]);
    return modifiedString < 10 ? 'success' : modifiedString >= 10 && modifiedString <= 20 ? 'warning' : 'error';
  }

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

  //TotalDossierAmbulatoire
  totalDossierAmbulatoireIsLoading = false;
  totalDossierAmbulatoireMetric: MetricDto | null = null;

  updateTotalDossierAmbulatoire(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTotalDossierAmbulatoire('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.totalDossierAmbulatoireIsLoading = true)),
        finalize(() => (this.totalDossierAmbulatoireIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalDossierAmbulatoireMetric = s;
      });
  }

  //TotalPEC
  totalPECIsLoading = false;
  totalPECMetric: MetricDto | null = null;

  updateTotalPEC(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTotalPEC('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.totalPECIsLoading = true)),
        finalize(() => (this.totalPECIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalPECMetric = s;
      });
  }

  //TotalExecutionAP
  TotalExecutionAPIsLoading = false;
  TotalExecutionAPMetric: MetricDto | null = null;

  updateTotalExecutionAP(query: IFilterRequest): void {
    this.suiviSinistreClient
      .getTotalExecutionAP('1.0', SuiviSinistreFilters.fromJS({ ...query.filters, etatClients: [] }))
      .pipe(
        tap(() => (this.TotalExecutionAPIsLoading = true)),
        finalize(() => (this.TotalExecutionAPIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.TotalExecutionAPMetric = s;
      });
  }

  //DEBUT GRILLE SINISTRE EN COURS
  public raffrachirSuiviTousLesSinistreEnCours(): void {
    this.sinistreEnCoursService.refresh(this.getFilter());
  }

  public dataStateChangeSuiviTousLesSinistreEnCours(state: DataStateChangeEvent): void {
    this.sinistreEnCoursService.state = state;
    this.sinistreEnCoursService.read(this.getFilter());
  }

  updateSuiviTousLesSinistreEnCours(query: ISuiviSinistreFilters): void {
    this.sinistreEnCoursService.refresh(query);
  }

  isExporting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportSinistreEnCours(): void {
    const exportSinistreEnCoursQuery = SuiviSinistreFilters.fromJS({ ...this.getFilter(), etatClients: [] });
    this.isExporting.next(true);
    this.suiviSinistreClient
      .exportSinistreEnCours('1.0', exportSinistreEnCoursQuery)
      .pipe(
        take(1),
        finalize(() => this.isExporting.next(false))
      )
      .subscribe((s) => {
        //s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE SINISTRE EN COURS

  //DEBUT GRILLE SINISTRE LIQUIDE
  public raffrachirSuiviSinistreLiquide(): void {
    this.sinistreLiquideService.refresh(this.getFilter());
  }

  public dataStateChangeSuiviSinistreLiquide(state: DataStateChangeEvent): void {
    this.sinistreLiquideService.state = state;
    this.sinistreLiquideService.read(this.getFilter());
  }

  updateSuiviSinistreLiquide(query: ISuiviSinistreFilters): void {
    this.sinistreLiquideService.refresh(query);
  }

  isExporting2: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportSinistreLiquide(): void {
    const exportSinistreLiquideQuery = SuiviSinistreFilters.fromJS({ ...this.getFilter(), etatClients: [] });
    this.isExporting2.next(true);
    this.suiviSinistreClient
      .exportSinistreLiquide('1.0', exportSinistreLiquideQuery)
      .pipe(
        take(1),
        finalize(() => this.isExporting2.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE SINISTRE LIQUIDE

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
  protected readonly eyeSlashIcon = eyeSlashIcon;
  protected readonly eyeIcon = eyeIcon;
  protected readonly menuIcon = menuIcon;

  dialogService = inject(DialogService);

  openDialog(dataItem: any) {
    const dialog = this.dialogService.open({
      title: 'Détail des délais de traitement pour chaque version du Nº Dossier : ' + dataItem.numeroDeclaration,
      content: HistoriqueDossierComponent,
      minWidth: 800,
      maxWidth: '85%',
      minHeight: 100,
      maxHeight: '90%',
    });
    const dialogComponent = dialog.content.instance as HistoriqueDossierComponent;
    dialogComponent.classeurId = dataItem.classeurId;
  }
}
