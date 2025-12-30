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
import { PecAvecRetourCieService } from '../../services/pec-avec-retourcie.data.service';
import { SuiviSinistreService } from '../../services/suivi-sinistre.service';
import { TousLesPecService } from '../../services/tous-les-pec.data.service';

//interface non utilisée
// interface IFilterRequest {
//   filters: ISuiviSinistreFilters
// }

@Component({
  selector: 'portals-nineteenth-tab',
  templateUrl: './nineteenth-tab.component.html',
  styleUrls: ['./nineteenth-tab.component.scss'],
  providers: [PecAvecRetourCieService, TousLesPecService],
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
export class NineteenthTabComponent implements OnInit {
  constructor(
    public suiviSinistreService: SuiviSinistreService,
    public suiviSinistreClient: SuiviSinistreClient,
    public pecAvecRetourCieService: PecAvecRetourCieService,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public tousLesPecService: TousLesPecService,
    private windowService: WindowService,
    private destroyRef: DestroyRef,
    private myUser: MyUserService,
    private roleService: RoleService
  ) {}

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
    this.pecAvecRetourCieService.reset();
    this.tousLesPecService.reset();
    this.suiviSinistreService.suiviSinistreFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: ISuiviSinistreFilters | null) => {
        if (queryObject == null) return;
        //variable non utilisée
        // let query = {
        //   filters: queryObject
        // };
        this.updateTotalPEC(queryObject);
        this.updateTotalPECAvecRetourCie(queryObject);
        this.updateSuiviPECAvecRetourCie(queryObject);
        this.updateSuiviToutesLesPEC(queryObject);
      });
  }

  //TotalPEC
  totalPECIsLoading = false;
  totalPECMetric: MetricDto | null = null;

  updateTotalPEC(query: ISuiviSinistreFilters): void {
    this.suiviSinistreClient
      .getTotalPEC('1.0', SuiviSinistreFilters.fromJS({ ...query, etatClients: [] }))
      .pipe(
        tap(() => (this.totalPECIsLoading = true)),
        finalize(() => (this.totalPECIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalPECMetric = s;
      });
  }

  //TotalPECAvecRetourCie
  totalPECAvecRetourCieIsLoading = false;
  totalPECAvecRetourCieMetric: MetricDto | null = null;

  updateTotalPECAvecRetourCie(query: ISuiviSinistreFilters): void {
    this.suiviSinistreClient
      .getTotalPECAvecRetourCie('1.0', SuiviSinistreFilters.fromJS({ ...query, etatClients: [] }))
      .pipe(
        tap(() => (this.totalPECAvecRetourCieIsLoading = true)),
        finalize(() => (this.totalPECAvecRetourCieIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalPECAvecRetourCieMetric = s;
      });
  }

  //DEBUT GRILLE PEC AVEC RETOUR

  public raffrachirSuiviPECAvecRetourCie(): void {
    this.pecAvecRetourCieService.refresh(this.getFilter());
  }

  public dataStateChangeSuiviPECAvecRetourCie(state: DataStateChangeEvent): void {
    this.pecAvecRetourCieService.state = state;
    this.pecAvecRetourCieService.read(this.getFilter());
  }

  updateSuiviPECAvecRetourCie(query: ISuiviSinistreFilters): void {
    this.pecAvecRetourCieService.refresh(query);
  }

  isExporting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportPriseEnChargeAvecRetourCie(): void {
    const exportPriseEnChargeAvecRetourCieQuery = SuiviSinistreFilters.fromJS(this.getFilter());
    this.isExporting.next(true);
    this.suiviSinistreClient
      .exportPriseEnChargeAvecRetourCie('1.0', exportPriseEnChargeAvecRetourCieQuery)
      .pipe(
        take(1),
        finalize(() => this.isExporting.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE PEC AVEC RETOUR

  //DEBUT GRILLE TOUS LES PEC

  public raffrachirSuiviToutesLesPEC(): void {
    this.tousLesPecService.refresh(this.getFilter());
  }

  public dataStateChangeSuiviToutesLesPEC(state: DataStateChangeEvent): void {
    this.tousLesPecService.state = state;
    this.tousLesPecService.read(this.getFilter());
  }

  updateSuiviToutesLesPEC(query: ISuiviSinistreFilters): void {
    this.tousLesPecService.refresh(query);
  }

  isExporting2: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportPriseEnCharge(): void {
    const exportPriseEnChargeQuery = SuiviSinistreFilters.fromJS(this.getFilter());
    this.isExporting2.next(true);
    this.suiviSinistreClient
      .exportPriseEnCharge('1.0', exportPriseEnChargeQuery)
      .pipe(
        take(1),
        finalize(() => this.isExporting2.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE TOUS LES PEC

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
