import { Component, DestroyRef, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { EnvironmentService, ITrigramme, toDateFormat, TRIGRAMME } from '@portals/base/core/core-component';
import {
  DateParameters,
  GetCiesQuery,
  GetNumeroCVsQuery,
  GetSouscripteurEncaissementsQuery,
  GetStatutEncaissementsQuery,
  GetTypeEncaissementsQuery,
  ReferentielClient,
  SuiviEncaissementCieFilters,
} from '@portals/client-reporting';
import {
  combineLatest,
  debounceTime,
  filter,
  finalize,
  map,
  startWith,
  Subject,
  Subscription,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { DashboardFields, DashboardSettings, IFilterField, RecomputeRelatedFields } from '../dashboard-model';
import { DetailSuiviEncaissementService } from './services/detail-suivi-encaissement-cie.service';
import { SuiviEncaissementCieService } from './services/suivi-encaissement-cie.service';
import dayjs from 'dayjs';
import { arrowRotateCwIcon, filterIcon, infoCircleIcon, pencilIcon } from '@progress/kendo-svg-icons';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { KENDO_CARD } from '@progress/kendo-angular-layout';
import { AsyncPipe } from '@angular/common';
import { AutoRefresherComponent } from '../auto-refresher/auto-refresher.component';
import { KENDO_DATEINPUT, KENDO_DATERANGE } from '@progress/kendo-angular-dateinputs';
import { KENDO_LABEL } from '@progress/kendo-angular-label';
import { KENDO_BUTTON, KENDO_BUTTONGROUP } from '@progress/kendo-angular-buttons';
import { DashboardSearchFieldComponent } from '../population-client/dashboard-search-field/dashboard-search-field.component';
import { KENDO_SWITCH } from '@progress/kendo-angular-inputs';
import { KENDO_TOOLTIP } from '@progress/kendo-angular-tooltip';
import { KENDO_SVGICON } from '@progress/kendo-angular-icons';
import { DashboardShellStore } from '../shared/dashboard-shell.store';

interface ISuiviEncaissementCieFilters {
  filters?: SuiviEncaissementCieFilters | undefined;
  dateParameters?: DateParameters | undefined;
  modeRegleur?: boolean | undefined;
}

@Component({
  selector: 'portals-suivi-encaissement-cie',
  templateUrl: './suivi-encaissement-cie.component.html',
  styleUrls: ['./suivi-encaissement-cie.component.scss'],
  providers: [SuiviEncaissementCieService, DetailSuiviEncaissementService, DashboardShellStore],
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
    KENDO_BUTTONGROUP,
  ],
})
export class SuiviEncaissementCieComponent implements OnInit {
  public IsInterne: boolean | undefined;
  constructor(
    private refClient: ReferentielClient,
    public suiviEncaissementCieService: SuiviEncaissementCieService,
    private env: EnvironmentService,
    public router: Router,
    private destroyRef: DestroyRef,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public uiStore: DashboardShellStore
  ) {
    this.IsInterne = this.env.activePortalClient === 'portail-souscripteur' ? false : true;
  }

  component: any | undefined;
  readonly filterOpen$ = this.uiStore.filterOpen$;
  readonly editMode$ = this.uiStore.editMode$;
  readonly editModeSignal = toSignal(this.editMode$, { initialValue: false });
  readonly modeRegleur = this.uiStore.modeRegleur;

  getTitle = this.router.events.pipe(
    startWith({ url: this.router.url }),
    filter((event: any) => event['url'] !== undefined),
    map((event) => {
      return this.navLinks.find((temp) => event.url.includes(temp.link.slice(2)))?.label;
    })
  );
  handleDateChange = combineLatest([
    this.suiviEncaissementCieService.formFilter.controls['startingDate'].valueChanges,
    this.suiviEncaissementCieService.formFilter.controls['endDate'].valueChanges,
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
    return <UntypedFormControl>this.suiviEncaissementCieService.formFilter.get(name);
  }

  public souscripteurField: IFilterField = {
    placeholder: 'Souscripteurs',
    name: DashboardFields.Souscripteur,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getSouscripteurEncaissements(
        '1.0',
        GetSouscripteurEncaissementsQuery.fromJS({ keyword: keyword?.toUpperCase() })
      ),
    onChanged: () => {
      RecomputeRelatedFields(this.fields);
      const fieldsExceptSouscripteur = this.fields.filter((f) => f.name != DashboardFields.Souscripteur);
      for (let i = 0; i < fieldsExceptSouscripteur.length; i++) fieldsExceptSouscripteur[i].formField().setValue([]);
    },
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Souscripteur),
  };

  public cieField: IFilterField = {
    placeholder: 'Cies',
    name: DashboardFields.Cie,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getCies(
        '1.0',
        GetCiesQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Cie),
  };

  public numeroCvField: IFilterField = {
    placeholder: 'Numéro CV',
    name: DashboardFields.NumeroCV,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getNumeroCVs(
        '1.0',
        GetNumeroCVsQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.NumeroCV),
  };

  public statusField: IFilterField = {
    placeholder: 'Status',
    name: DashboardFields.Status,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getStatutEncaissements(
        '1.0',
        GetStatutEncaissementsQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Status),
  };
  public typeEncaissementField: IFilterField = {
    placeholder: 'Type Encaissement',
    name: DashboardFields.TypeEncaissement,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getTypeEncaissements(
        '1.0',
        GetTypeEncaissementsQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.TypeEncaissement),
  };

  public fields: IFilterField[] = [
    this.souscripteurField,
    this.cieField,
    this.numeroCvField,
    this.statusField,
    this.typeEncaissementField,
  ];

  ngOnInit(): void {
    for (let i = 0; i < this.fields.length; i++) {
      this.registerField(this.fields[i]);
      this.fields[i].keyword.next('');
    }
    this.souscripteurField.keyword.next('');
    this.souscripteurField.onChanged!();
    setTimeout(() => this.search(), 1000);
  }

  registerField(field: IFilterField): Subscription {
    //on value changed
    if (field.onChanged) {
      field
        .formField()
        .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
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
            take(1)
          )
        )
      )
      .subscribe((result) => {
        field.data = result;
      });
  }

  reset() {
    this.suiviEncaissementCieService.filterByNextcare.next(false);
    this.suiviEncaissementCieService.filterForToday.next(false);
    const today = dayjs().toDate();
    const lastYear = !this.IsInterne ? dayjs().set('month', 0).set('date', 1).toDate() : dayjs('2022-01-01').toDate();
    this.suiviEncaissementCieService.formFilter.reset({
      startingDate: lastYear,
      endDate: today,
      souscripteur: [],
      cie: [],
      numeroLot: [],
      status: [],
      typeEncaissement: [],
      numeroCV: [],
    });
    this.uiStore.setModeRegleur(undefined);
    RecomputeRelatedFields(this.fields);
  }

  search() {
    const query = this.getFilter();
    this.suiviEncaissementCieService.suiviEncaissementCieFilters$.next(query);
  }

  public getFilter(): ISuiviEncaissementCieFilters {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value!);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value!);

    if (this.suiviEncaissementCieService.filterForToday.getValue()) {
      startDate = new Date();
      endDate = new Date();
    }
    return <ISuiviEncaissementCieFilters>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      cies: this.getField(DashboardFields.Cie).value,
      status: this.getField(DashboardFields.Status).value,
      typeEncaissements: this.getField(DashboardFields.TypeEncaissement).value,
      filtreNC:
        this.trigramme.authority === 'AZM' ? this.suiviEncaissementCieService.filterByNextcare.getValue() : false,
      modeRegleur: this.modeRegleur(),
      numeroCVs: this.getField(DashboardFields.NumeroCV).value,
      dateParameters: <DateParameters>{
        startingDate: startDate,
        endDate: endDate,
      },
    };
  }

  navLinks = [
    {
      label: 'Détail',
      link: './detail',
      index: 19,
    },
    {
      label: 'Suivi',
      link: './suivi',
      index: 20,
    },
  ];
  protected readonly filterIcon = filterIcon;
  protected readonly pencilIcon = pencilIcon;
  protected readonly arrowRotateCwIcon = arrowRotateCwIcon;
  protected readonly infoCircleIcon = infoCircleIcon;
}
