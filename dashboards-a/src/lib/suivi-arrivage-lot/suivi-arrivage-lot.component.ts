import { AsyncPipe } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { EnvironmentService, ITrigramme, toDateFormat, TRIGRAMME } from '@portals/base/core/core-component';
import { AppModeService } from '@portals/base/core/shared-services';
import {
  DateParameters,
  GetEcartQuery,
  GetEtatLotQuery,
  GetNumerosLotQuery2,
  GetPolicesSinistreQuery,
  GetSouscripteursSinistreQuery,
  GetTotalSaisieQuery,
  ReferentielClient,
  SuiviArrivageLotFilters,
} from '@portals/client-reporting';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { KENDO_DATEINPUT, KENDO_DATERANGE } from '@progress/kendo-angular-dateinputs';
import { KENDO_SVGICON } from '@progress/kendo-angular-icons';
import { KENDO_SWITCH } from '@progress/kendo-angular-inputs';
import { KENDO_LABEL } from '@progress/kendo-angular-label';
import { KENDO_CARD, TabStripComponent } from '@progress/kendo-angular-layout';
import { KENDO_TOOLTIP } from '@progress/kendo-angular-tooltip';
import { arrowRotateCwIcon, filterIcon, infoCircleIcon, pencilIcon } from '@progress/kendo-svg-icons';
import dayjs from 'dayjs';
import { combineLatest, filter, map, startWith, Subject, Subscription } from 'rxjs';
import { debounceTime, finalize, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AutoRefresherComponent } from '../auto-refresher/auto-refresher.component';
import { DashboardFields, DashboardSettings, IFilterField, RecomputeRelatedFields } from '../dashboard-model';
import { DashboardSearchFieldComponent } from '../population-client/dashboard-search-field/dashboard-search-field.component';
import { SuiviArrivageLotService } from './services/suivi-arrivage-lot.data.service';
import { SuiviArrivageService } from './services/suivi-arrivage-lot.service';
import { DashboardShellStore } from '../shared/dashboard-shell.store';
import { toSignal } from '@angular/core/rxjs-interop';

interface ISuiviArrivageLotFilters {
  filters?: SuiviArrivageLotFilters | undefined;
  dateParameters?: DateParameters | undefined;
}

@Component({
  selector: 'portals-suivi-arrivage-lot',
  templateUrl: './suivi-arrivage-lot.component.html',
  styleUrls: ['./suivi-arrivage-lot.component.scss'],
  providers: [SuiviArrivageLotService, SuiviArrivageService, DashboardShellStore],
  encapsulation: ViewEncapsulation.None,
  imports: [
    KENDO_CARD,
    ReactiveFormsModule,
    AsyncPipe,
    AutoRefresherComponent,
    KENDO_DATERANGE,
    KENDO_LABEL,
    KENDO_DATEINPUT,
    KENDO_BUTTON,
    DashboardSearchFieldComponent,
    KENDO_SWITCH,
    RouterOutlet,
    KENDO_TOOLTIP,
    KENDO_SVGICON,
  ],
})
export class SuiviArrivageLotComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();

  public isInterne: boolean | undefined;
  appMode = this.appModeService.appMode;
  readonly filterOpen$ = this.uiStore.filterOpen$;
  readonly editMode$ = this.uiStore.editMode$;
  readonly editModeSignal = toSignal(this.editMode$, { initialValue: false });

  constructor(
    private refClient: ReferentielClient,
    public suiviArrivageService: SuiviArrivageService,
    private router: Router,
    private env: EnvironmentService,
    private appModeService: AppModeService,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public uiStore: DashboardShellStore
  ) {
    this.isInterne = this.env.activePortalClient === 'portail-souscripteur' ? false : true;
  }

  component: any | undefined;

  getTitle = this.router.events.pipe(
    startWith({ url: this.router.url }),
    filter((event: any) => event['url'] !== undefined),
    map((event) => {
      return this.navLinks.find((temp) => event.url.includes(temp.link.slice(2)))?.label;
    })
  );
  handleDateChange = combineLatest([
    this.suiviArrivageService.formFilter.controls['startingDate'].valueChanges,
    this.suiviArrivageService.formFilter.controls['endDate'].valueChanges,
  ]).pipe(
    tap(() => {
      this.search();
    })
  );

  onOutletLoaded(component: any, editMode: boolean) {
    if (this.component === undefined) this.component = component;
    component.editMode = editMode;
  }

  toggleFilters(): void {
    this.uiStore.toggleFilter();
  }

  setEditMode(editMode: boolean): void {
    this.uiStore.setEditMode(editMode);
    if (this.component) {
      this.component.editMode = editMode;
    }
  }

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.suiviArrivageService.formFilter.get(name);
  }

  public souscripteurField: IFilterField = {
    placeholder: 'Souscripteurs',
    name: DashboardFields.Souscripteur,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getSouscripteursSinistre(
        '1.0',
        GetSouscripteursSinistreQuery.fromJS({ keyword: keyword?.toUpperCase() })
      ),
    onChanged: () => {
      RecomputeRelatedFields(this.fields);
      const fieldsExceptSouscripteur = this.fields.filter((f) => f.name != DashboardFields.Souscripteur);
      for (let i = 0; i < fieldsExceptSouscripteur.length; i++) fieldsExceptSouscripteur[i].formField().setValue([]);
    },
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Souscripteur),
  };
  public policeField: IFilterField = {
    placeholder: 'Polices',
    name: DashboardFields.Police,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getPolicesSinistre(
        '1.0',
        GetPolicesSinistreQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Police),
  };

  public numeroLotField: IFilterField = {
    placeholder: 'Numéro de lot',
    name: DashboardFields.NumeroLot,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getNumerosLot(
        '1.0',
        GetNumerosLotQuery2.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.NumeroLot),
  };
  public ecartField: IFilterField = {
    placeholder: 'Ecart différent de',
    name: DashboardFields.Ecart,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) => this.refClient.getEcart('1.0', GetEcartQuery.fromJS({ keyword: keyword })),
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Ecart),
  };
  public etatLotField: IFilterField = {
    placeholder: 'Etat',
    name: DashboardFields.EtatLot,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) => this.refClient.getEtatLot('1.0', GetEtatLotQuery.fromJS({ keyword: keyword })),
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.EtatLot),
  };
  public totalSaisieField: IFilterField = {
    placeholder: 'Total Saisie',
    name: DashboardFields.TotalSaisie,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) => this.refClient.getTotalSaisie('1.0', GetTotalSaisieQuery.fromJS({ keyword: keyword })),
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.TotalSaisie),
  };

  public fields: IFilterField[] = [
    this.souscripteurField,
    this.policeField,
    this.numeroLotField,
    this.totalSaisieField,
    this.ecartField,
    this.etatLotField,
  ];

  ngOnInit(): void {
    for (let i = 0; i < this.fields.length; i++) {
      this.registerField(this.fields[i], this.destroy$);
      this.fields[i].keyword.next('');
    }
    this.souscripteurField.keyword.next('');
    this.souscripteurField.onChanged!();
    setTimeout(() => this.search(), 1000);
  }

  registerField(field: IFilterField, destroy$: Subject<boolean>): Subscription {
    //on value changed
    if (field.onChanged) {
      field
        .formField()
        .valueChanges.pipe(takeUntil(destroy$))
        .subscribe((v) => {
          if (field.onChanged != null) field.onChanged();
        });
    }
    //autocomplete data
    return field.keyword
      .pipe(
        tap(() => (field.isLoading = true)),
        debounceTime(DashboardSettings.DebounceTime),
        switchMap((keyword) =>
          field.operation(keyword).pipe(
            finalize(() => (field.isLoading = false)),
            takeUntil(destroy$)
          )
        )
      )
      .subscribe((result) => {
        field.data = result;
      });
  }

  reset() {
    this.suiviArrivageService.filterByPolice.next(false);
    this.suiviArrivageService.filterByNextcare.next(false);
    this.suiviArrivageService.filterForToday.next(false);
    const today = dayjs().toDate();
    const lastYear = !this.isInterne ? dayjs().set('month', 0).set('date', 1).toDate() : dayjs('2022-01-01').toDate();
    this.suiviArrivageService.formFilter.reset({
      startingDate: lastYear,
      endDate: today,
      souscripteur: [],
      numeroLot: [],
      police: [],
      ecart: [],
      etatLot: [],
      totalSaisie: [],
    });
    RecomputeRelatedFields(this.fields);
  }

  search() {
    const query = this.getFilter();
    this.suiviArrivageService.suiviArrivageFilters$.next(query);
  }

  public getFilter(): ISuiviArrivageLotFilters {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value!);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value!);

    if (this.suiviArrivageService.filterForToday.getValue()) {
      startDate = new Date();
      endDate = new Date();
    }
    return <ISuiviArrivageLotFilters>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      numeroLots: this.getField(DashboardFields.NumeroLot).value,
      polices: this.getField(DashboardFields.Police).value,
      ecarts: this.getField(DashboardFields.Ecart).value,
      totalSaisies: this.getField(DashboardFields.TotalSaisie).value,
      etatLots: this.getField(DashboardFields.EtatLot).value,
      filtrePolice: this.trigramme.authority === 'EBM' ? this.suiviArrivageService.filterByPolice.getValue() : true,
      filtreNC: this.trigramme.authority === 'AZM' ? this.suiviArrivageService.filterByNextcare.getValue() : false,
      dateParameters: <DateParameters>{
        startingDate: startDate,
        endDate: endDate,
      },
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  @ViewChild('mainTabNavBar') tabNavBar!: TabStripComponent;

  navLinks = [
    {
      label: 'Dossiers',
      link: './dossiers',
      index: 4,
    },
    {
      label: 'Lots',
      link: './lots',
      index: 5,
    },
  ];
  protected readonly filterIcon = filterIcon;
  protected readonly pencilIcon = pencilIcon;
  protected readonly arrowRotateCwIcon = arrowRotateCwIcon;
  protected readonly infoCircleIcon = infoCircleIcon;
}
