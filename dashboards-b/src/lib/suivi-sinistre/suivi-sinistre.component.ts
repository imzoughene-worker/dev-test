import { Router, RouterOutlet } from '@angular/router';
import { Component, DestroyRef, Inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import {
  DateParameters,
  GetAdherentsQuery,
  GetEtatsClientQuery,
  GetEtatsQuery,
  GetNumerosDeclarationQuery,
  GetNumerosLotQuery,
  GetPolicesSinistreQuery,
  GetSouscripteursSinistreQuery,
  ReferentielClient,
  SuiviSinistreFilters,
} from '@portals/client-reporting';
import { EnvironmentService, ITrigramme, toDateFormat, TRIGRAMME } from '@portals/base/core/core-component';
import { combineLatest, filter, map, startWith, Subject, Subscription, take } from 'rxjs';
import { debounceTime, finalize, switchMap, tap } from 'rxjs/operators';
import { DashboardFields, DashboardSettings, IFilterField, RecomputeRelatedFields } from '../dashboard-model';
import { AccordPrealableService } from './services/accord-prealable.data.service';
import { ComplementInformationEchuService } from './services/complement-information-echu.data.service';
import { ContreVisiteDelaiDepasseService } from './services/contre-visite-delai-depasse.data.service';
import { PecAvecRetourCieService } from './services/pec-avec-retourcie.data.service';
import { RejetsService } from './services/rejets.data.service';
import { SinistreEnCoursService } from './services/sinistre-en-cours.data.service';
import { SinistreLiquideService } from './services/sinistre-liquide.data.service';
import { SuiviComplementInformationService } from './services/suivi-complement-information.data.service';
import { SuiviContreVisiteService } from './services/suivi-contre-visite.data.service';
import { SuiviSinistreService } from './services/suivi-sinistre.service';
import { TousLesPecService } from './services/tous-les-pec.data.service';
import dayjs from 'dayjs';
import { arrowRotateCwIcon, filterIcon, infoCircleIcon, pencilIcon } from '@progress/kendo-svg-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { toSignal } from '@angular/core/rxjs-interop';

interface ISuiviSinistreFilters {
  filters?: SuiviSinistreFilters | undefined;
  dateParameters?: DateParameters | undefined;
  modeRegleur?: boolean | undefined;
}

@Component({
  selector: 'portals-suivi-sinistre',
  templateUrl: './suivi-sinistre.component.html',
  styleUrls: ['./suivi-sinistre.component.scss'],
  providers: [
    AccordPrealableService,
    ComplementInformationEchuService,
    ContreVisiteDelaiDepasseService,
    PecAvecRetourCieService,
    RejetsService,
    SinistreEnCoursService,
    SinistreLiquideService,
    SuiviComplementInformationService,
    SuiviContreVisiteService,
    TousLesPecService,
    SuiviSinistreService,
    DashboardShellStore,
  ],
  imports: [
    KENDO_CARD,
    AsyncPipe,
    AutoRefresherComponent,
    KENDO_DATERANGE,
    KENDO_LABEL,
    KENDO_DATEINPUT,
    ReactiveFormsModule,
    KENDO_BUTTON,
    DashboardSearchFieldComponent,
    KENDO_SWITCH,
    RouterOutlet,
    KENDO_TOOLTIP,
    KENDO_SVGICON,
    KENDO_BUTTONGROUP,
  ],
})
export class SuiviSinistreComponent implements OnInit {
  public isExterne: boolean | undefined;

  readonly filterOpen$ = this.uiStore.filterOpen$;
  readonly editMode$ = this.uiStore.editMode$;
  readonly editModeSignal = toSignal(this.editMode$, { initialValue: false });
  readonly modeRegleur = this.uiStore.modeRegleur;

  constructor(
    private refClient: ReferentielClient,
    public suiviSinistreService: SuiviSinistreService,
    private router: Router,
    private env: EnvironmentService,
    private destroyRef: DestroyRef,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public uiStore: DashboardShellStore
  ) {
    this.isExterne = this.env.activePortalClient === 'portail-souscripteur' ? true : false;
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
    this.suiviSinistreService.formFilter.controls['startingDate'].valueChanges.pipe(debounceTime(400)),
    this.suiviSinistreService.formFilter.controls['endDate'].valueChanges.pipe(debounceTime(400)),
  ]).pipe(
    tap(() => {
      this.search();
    })
  );

  onOutletLoaded(component: any, editMode: boolean) {
    this.suiviSinistreService.filterByPolice.next(false);
    this.suiviSinistreService.filterByNextcare.next(false);
    this.suiviSinistreService.filterForToday.next(false);
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
    return <UntypedFormControl>this.suiviSinistreService.formFilter.get(name);
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
      this.refClient.getSinistreNumerosLot(
        '1.0',
        GetNumerosLotQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.NumeroLot),
  };

  public adherentField: IFilterField = {
    placeholder: 'Adherents',
    name: DashboardFields.Adherent,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getAdherents(
        '1.0',
        GetAdherentsQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Adherent),
  };

  public numeroDeclarationField: IFilterField = {
    placeholder: 'Numéro Declarations',
    name: DashboardFields.NumeroDeclaration,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getNumerosDeclaration(
        '1.0',
        GetNumerosDeclarationQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.NumeroDeclaration),
  };

  public etatField: IFilterField = {
    placeholder: 'Etats',
    name: DashboardFields.Etat,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) => this.refClient.getEtats('1.0', GetEtatsQuery.fromJS({ keyword: keyword })),
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Etat),
  };
  public etatClientField: IFilterField = {
    placeholder: 'Etats',
    name: DashboardFields.EtatClient,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) => this.refClient.getEtatsClient('1.0', GetEtatsClientQuery.fromJS({ keyword: keyword })),
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.EtatClient),
  };

  public fields: IFilterField[] = [
    this.souscripteurField,
    this.policeField,
    this.numeroLotField,
    this.adherentField,
    this.numeroDeclarationField,
    this.etatField,
    this.etatClientField,
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
    this.suiviSinistreService.filterByPolice.next(false);
    this.suiviSinistreService.filterByNextcare.next(false);
    this.suiviSinistreService.filterForToday.next(false);
    const today = dayjs().toDate();
    const lastYear = this.isExterne ? dayjs().set('month', 0).set('date', 1).toDate() : dayjs('2022-01-01').toDate();
    this.suiviSinistreService.formFilter.reset({
      startingDate: lastYear,
      endDate: today,
      souscripteur: [],
      numeroLot: [],
      police: [],
      adherent: [],
      numeroDeclaration: [],
      etat: [],
      etatClient: [],
    });
    this.uiStore.setModeRegleur(undefined);
    RecomputeRelatedFields(this.fields);
  }

  search() {
    const query = this.getFilter();
    this.suiviSinistreService.suiviSinistreFilters$.next(query);
  }

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
      EtatClients: this.getField(DashboardFields.EtatClient).value,
      filtrePolice: this.trigramme.authority === 'EBM' ? this.suiviSinistreService.filterByPolice.getValue() : true,
      filtreNC: this.trigramme.authority === 'AZM' ? this.suiviSinistreService.filterByNextcare.getValue() : false,
      modeRegleur: this.modeRegleur(),
      dateParameters: <DateParameters>{
        startingDate: startDate,
        endDate: endDate,
      },
    };
  }

  navLinks = [
    {
      label: 'Résumé',
      link: './resume',
      index: 8,
    },
    {
      label: 'Remb.Cie (total)',
      link: './remboursement-compagnie',
      index: 9,
    },
    {
      label: 'Type Dossiers (total)',
      link: './type-dossiers',
      index: 10,
    },
    {
      label: 'Prestataires Soins',
      link: './prestataires-soins',
      index: 11,
    },
    {
      label: 'Conso.(rubriques)',
      link: './consommation-rubriques',
      index: 12,
    },
    {
      label: 'Conso.(Top 10)',
      link: './consommation-top10',
      index: 13,
    },
    {
      label: 'Suivi dossiers',
      link: './suivi-dossiers',
      index: 14,
    },
    {
      label: 'Non Remb.',
      link: './non-rembourse',
      index: 15,
    },
    {
      label: 'Suivi CV',
      link: './suivi-cv',
      index: 16,
    },
    {
      label: 'Suivi AP',
      link: './suivi-ap',
      index: 17,
    },
    {
      label: 'Suivi PEC',
      link: './suivi-pec',
      index: 18,
    },
  ];
  protected readonly filterIcon = filterIcon;
  protected readonly pencilIcon = pencilIcon;
  protected readonly arrowRotateCwIcon = arrowRotateCwIcon;
  protected readonly infoCircleIcon = infoCircleIcon;
}
