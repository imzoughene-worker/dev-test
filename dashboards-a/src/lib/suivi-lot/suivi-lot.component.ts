import { Router, RouterOutlet } from '@angular/router';
import { Component, DestroyRef, Inject, OnInit, ViewEncapsulation } from '@angular/core';
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
  GetThirdTagsQuery,
  GetTypeRetourCiesQuery,
  ReferentielClient,
  SuiviLotFilters,
} from '@portals/client-reporting';
import { EnvironmentService, ITrigramme, toDateFormat, TRIGRAMME } from '@portals/base/core/core-component';
import { combineLatest, filter, map, startWith, Subject, Subscription, take } from 'rxjs';
import { debounceTime, finalize, switchMap, tap } from 'rxjs/operators';
import { DashboardFields, DashboardSettings, IFilterField, RecomputeRelatedFields } from '../dashboard-model';
import { DetailDossierService } from './services/dossier.data.service';
import { SuiviLotService } from './services/suivi-lot.service';
import dayjs from 'dayjs';
import { arrowRotateCwIcon, filterIcon, infoCircleIcon, pencilIcon } from '@progress/kendo-svg-icons';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { KENDO_CARD } from '@progress/kendo-angular-layout';
import { AsyncPipe } from '@angular/common';
import { AutoRefresherComponent } from '../auto-refresher/auto-refresher.component';
import { KENDO_DATEINPUT, KENDO_DATERANGE } from '@progress/kendo-angular-dateinputs';
import { KENDO_LABEL } from '@progress/kendo-angular-label';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { DashboardSearchFieldComponent } from '../population-client/dashboard-search-field/dashboard-search-field.component';
import { KENDO_SWITCH } from '@progress/kendo-angular-inputs';
import { AppModeService } from '@portals/base/core/shared-services';
import { KENDO_TOOLTIP } from '@progress/kendo-angular-tooltip';
import { KENDO_SVGICON } from '@progress/kendo-angular-icons';
import { DashboardShellStore } from '../shared/dashboard-shell.store';

interface ISuiviLotFilters {
  filters?: SuiviLotFilters | undefined;
  dateParameters?: DateParameters | undefined;
}

@Component({
  selector: 'portals-suivi-lot',
  templateUrl: './suivi-lot.component.html',
  styleUrls: ['./suivi-lot.component.scss'],
  providers: [DetailDossierService, SuiviLotService, DashboardShellStore],
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
export class SuiviLotComponent implements OnInit {
  public isExterne: boolean | undefined;
  navLinks: { label: string; link: string; index: number }[] = [];

  constructor(
    private refClient: ReferentielClient,
    public suiviLotService: SuiviLotService,
    private router: Router,
    protected env: EnvironmentService,
    private destroyRef: DestroyRef,
    private appModeService: AppModeService,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public uiStore: DashboardShellStore
  ) {
    this.isExterne = this.env.isSouscripteurClient;
    this.navLinks = [
      {
        label: 'Liquidation Lot',
        link: './liquidation-lot',
        index: 6,
      },
      {
        label: 'Listing Dossiers',
        link: './listing-dossiers',
        index: 7,
      },
    ];
  }

  component: any | undefined;
  readonly filterOpen$ = this.uiStore.filterOpen$;
  readonly editMode$ = this.uiStore.editMode$;
  readonly editModeSignal = toSignal(this.editMode$, { initialValue: false });

  getTitle = this.router.events.pipe(
    startWith({ url: this.router.url }),
    filter((event: any) => event['url'] !== undefined),
    map((event) => {
      return this.navLinks.find((temp) => event.url.includes(temp.link.slice(2)))?.label;
    })
  );
  handleDateChange = combineLatest([
    this.suiviLotService.formFilter.controls['startingDate'].valueChanges,
    this.suiviLotService.formFilter.controls['endDate'].valueChanges,
  ]).pipe(
    tap(() => {
      this.search();
    })
  );

  onOutletLoaded(component: any, editMode: boolean) {
    this.suiviLotService.filterByPolice.next(false);
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
    return <UntypedFormControl>this.suiviLotService.formFilter.get(name);
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

  public ecartField: IFilterField = {
    placeholder: 'Écarts',
    name: DashboardFields.Ecart,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) => this.refClient.getEcart('1.0', GetEtatsQuery.fromJS({ keyword: keyword })),
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Ecart),
  };

  public etatClientField: IFilterField = {
    placeholder: 'Etats DM',
    name: DashboardFields.EtatClient,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) => this.refClient.getEtatsClient('1.0', GetEtatsClientQuery.fromJS({ keyword: keyword })),
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.EtatClient),
  };

  public typeRetourField: IFilterField = {
    placeholder: this.appModeService.appMode()?.isCourtierMode ? 'Type Retour Cie' : 'Type de Précompte',
    name: DashboardFields.TypeRetour,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getTypeRetourCies('1.0', GetTypeRetourCiesQuery.fromJS({ keyword: keyword })),
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.TypeRetour),
  };
  public thirdTagField: IFilterField = {
    placeholder: 'Third Tag',
    name: DashboardFields.ThirdTag,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) => this.refClient.getThirdTags('1.0', GetThirdTagsQuery.fromJS({ keyword: keyword })),
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.ThirdTag),
  };

  public fields: IFilterField[] = [
    this.souscripteurField,
    this.policeField,
    this.numeroLotField,
    this.adherentField,
    this.numeroDeclarationField,
    this.etatField,
    this.ecartField,
    this.etatClientField,
    this.typeRetourField,
    this.thirdTagField,
  ];

  ngOnInit(): void {
    for (let i = 0; i < this.fields.length; i++) {
      this.registerField(this.fields[i]);
      this.fields[i].keyword.next('');
    }
    this.souscripteurField.keyword.next('');
    this.souscripteurField.onChanged!();
    setTimeout(() => this.search(), 1000);
    // if (this.env.isSouscripteurClient) {
    //   this.getField(DashboardFields.ThirdTag).setValue(['-']);
    // }
  }

  filterForTodayChange(e: boolean) {
    this.suiviLotService.filterForToday.next(e);
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
    this.suiviLotService.filterByPolice.next(false);
    this.suiviLotService.filterByNextcare.next(false);
    this.suiviLotService.filterForToday.next(false);
    const today = dayjs().toDate();
    const lastYear = this.isExterne ? dayjs().set('month', 0).set('date', 1).toDate() : dayjs('2022-01-01').toDate();
    this.suiviLotService.formFilter.reset({
      startingDate: lastYear,
      endDate: today,
      souscripteur: [],
      numeroLot: [],
      police: [],
      adherent: [],
      numeroDeclaration: [],
      etat: [],
      etatClient: [],
      typeRetour: [],
      ecart: [],
      thirdTag: [],
      totalSaisie: [],
    });
    RecomputeRelatedFields(this.fields);
  }

  search() {
    const query = this.getFilter();
    this.suiviLotService.suiviLotFilters$.next(query);
  }

  public getFilter(): ISuiviLotFilters {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value!);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value!);

    if (this.suiviLotService.filterForToday.getValue()) {
      startDate = new Date();
      endDate = new Date();
    }
    return <ISuiviLotFilters>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      numeroLots: this.getField(DashboardFields.NumeroLot).value,
      polices: this.getField(DashboardFields.Police).value,
      adherents: this.getField(DashboardFields.Adherent).value,
      numeroDeclarations: this.getField(DashboardFields.NumeroDeclaration).value,
      etats: this.getField(DashboardFields.Etat).value,
      etatClients: this.getField(DashboardFields.EtatClient).value,
      typeRetours: this.getField(DashboardFields.TypeRetour).value,
      thirdTags: this.getField(DashboardFields.ThirdTag).value,
      filtrePolice: this.trigramme.authority === 'EBM' ? this.suiviLotService.filterByPolice.getValue() : true,
      filtreNC: this.trigramme.authority === 'AZM' ? this.suiviLotService.filterByNextcare.getValue() : false,
      dateParameters: <DateParameters>{
        startingDate: startDate,
        endDate: endDate,
      },
    };
  }

  protected readonly filterIcon = filterIcon;
  protected readonly pencilIcon = pencilIcon;
  protected readonly arrowRotateCwIcon = arrowRotateCwIcon;
  protected readonly infoCircleIcon = infoCircleIcon;
}
