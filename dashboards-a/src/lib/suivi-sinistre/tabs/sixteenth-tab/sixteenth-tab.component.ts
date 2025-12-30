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
import { ComplementInformationEchuService } from '../../services/complement-information-echu.data.service';
import { RejetsService } from '../../services/rejets.data.service';
import { SuiviComplementInformationService } from '../../services/suivi-complement-information.data.service';
import { SuiviSinistreService } from '../../services/suivi-sinistre.service';

// interface non utilisée
// interface IFilterRequest {
//   filters: ISuiviSinistreFilters
// }

@Component({
  selector: 'portals-sixteenth-tab',
  templateUrl: './sixteenth-tab.component.html',
  styleUrls: ['./sixteenth-tab.component.scss'],
  imports: [
    KENDO_TILELAYOUT,
    KENDO_BUTTON,
    KENDO_GRID,
    GridPersistanceDirective,
    AsyncPipe,
    DateLongPipe,
    MetricChartComponent,
  ],
})
export class SixteenthTabComponent implements OnInit {
  constructor(
    public suiviSinistreService: SuiviSinistreService,
    public suiviSinistreClient: SuiviSinistreClient,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public rejetsService: RejetsService,
    public suiviComplementInformationService: SuiviComplementInformationService,
    public complementInformationEchuService: ComplementInformationEchuService,
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
    this.rejetsService.reset();
    this.suiviComplementInformationService.reset();
    this.complementInformationEchuService.reset();
    this.suiviSinistreService.suiviSinistreFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: ISuiviSinistreFilters | null) => {
        if (queryObject == null) return;
        // variable non utilisée
        // let query = {
        //   filters: queryObject
        // };
        this.updateNombreComplementInformations(queryObject);
        this.updateTotalComplementInformationEchu(queryObject);
        this.updateRejets(queryObject);
        this.updateSuiviComplementInformations(queryObject);
        this.updateDepotComplementInformationEchu(queryObject);
      });
  }

  //NombreComplementInformations
  nombreComplementInformationsIsLoading = false;
  nombreComplementInformationsMetric: MetricDto | null = null;

  updateNombreComplementInformations(query: ISuiviSinistreFilters): void {
    this.suiviSinistreClient
      .getNombreComplementInformations('1.0', SuiviSinistreFilters.fromJS({ ...query, etatClients: [] }))
      .pipe(
        tap(() => (this.nombreComplementInformationsIsLoading = true)),
        finalize(() => (this.nombreComplementInformationsIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.nombreComplementInformationsMetric = s;
      });
  }

  //TotalComplementInformationEchu
  totalComplementInformationEchuIsLoading = false;
  totalComplementInformationEchuMetric: MetricDto | null = null;

  updateTotalComplementInformationEchu(query: ISuiviSinistreFilters): void {
    this.suiviSinistreClient
      .getTotalComplementInformationEchu('1.0', SuiviSinistreFilters.fromJS({ ...query, etatClients: [] }))
      .pipe(
        tap(() => (this.totalComplementInformationEchuIsLoading = true)),
        finalize(() => (this.totalComplementInformationEchuIsLoading = false)),
        take(1)
      )
      .subscribe((s) => {
        this.totalComplementInformationEchuMetric = s;
      });
  }

  //DEBUT GRILLE REJETS
  public raffrachirRejets(): void {
    this.rejetsService.refresh(this.getFilter());
  }

  public dataStateChangeRejets(state: DataStateChangeEvent): void {
    this.rejetsService.state = state;
    this.rejetsService.read(this.getFilter());
  }

  updateRejets(query: ISuiviSinistreFilters): void {
    this.rejetsService.refresh(query);
  }

  isExporting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportRejets(): void {
    const exportRejetsQuery = SuiviSinistreFilters.fromJS(this.getFilter());
    this.isExporting.next(true);
    this.suiviSinistreClient
      .exportRejets('1.0', exportRejetsQuery)
      .pipe(
        take(1),
        finalize(() => this.isExporting.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE REJETS

  //DEBUT GRILLE COMPLEMENT INFORMATION
  public raffrachirSuiviComplementInformations(): void {
    this.suiviComplementInformationService.refresh(this.getFilter());
  }

  public dataStateChangeSuiviComplementInformations(state: DataStateChangeEvent): void {
    this.suiviComplementInformationService.state = state;
    this.suiviComplementInformationService.read(this.getFilter());
  }

  updateSuiviComplementInformations(query: ISuiviSinistreFilters): void {
    this.suiviComplementInformationService.refresh(query);
  }

  isExporting2: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportComplementInformation(): void {
    const exportComplementInformationQuery = SuiviSinistreFilters.fromJS(this.getFilter());
    this.isExporting2.next(true);
    this.suiviSinistreClient
      .exportSuiviComplementInformations('1.0', exportComplementInformationQuery)
      .pipe(
        take(1),
        finalize(() => this.isExporting2.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE COMPLEMENT INFORMATION

  //DEBUT GRILLE COMPLEMENT INFORMATION ECHU

  public raffrachirDepotComplementInformationEchu(): void {
    this.complementInformationEchuService.refresh(this.getFilter());
  }

  public dataStateChangeDepotComplementInformationEchu(state: DataStateChangeEvent): void {
    this.complementInformationEchuService.state = state;
    this.complementInformationEchuService.read(this.getFilter());
  }

  updateDepotComplementInformationEchu(query: ISuiviSinistreFilters): void {
    this.complementInformationEchuService.refresh(query);
  }

  isExporting3: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportComplementInformationEchu(): void {
    const exportComplementInformationEchuQuery = SuiviSinistreFilters.fromJS(this.getFilter());
    this.isExporting3.next(true);
    this.suiviSinistreClient
      .exportDepotComplementInformationEchu('1.0', exportComplementInformationEchuQuery)
      .pipe(
        take(1),
        finalize(() => this.isExporting3.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE COMPLEMENT INFORMATION ECHU

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
