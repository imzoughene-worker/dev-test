import {
  AffiliationFilter,
  DateParameters,
  GetAnneesAdhesionQuery,
  GetNumerosAdhesionQuery,
  GetPolicesAffiliationQuery,
  GetSouscripteursAffiliationQuery,
  GetStatusQuery,
  GetTrimestresAdhesionQuery,
  ReferentielClient,
} from '@portals/client-reporting';
import { DashboardFields, DashboardSettings, IFilterField, RecomputeRelatedFields } from '../dashboard-model';
import { Component, DestroyRef, OnInit, ViewEncapsulation } from '@angular/core';
import { debounceTime, finalize, switchMap, tap } from 'rxjs/operators';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { combineLatest, filter, map, startWith, Subject, Subscription, take } from 'rxjs';
import { EnvironmentService, toDateFormat } from '@portals/base/core/core-component';
import { AdhesionActiveService } from './services/adhesion-active.data.service';
import { AdhesionSortanteService } from './services/adhesion-sortante.data.service';
import { PopulationClientService } from './services/population-client.service';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import dayjs from 'dayjs';
import { arrowRotateCwIcon, filterIcon, pencilIcon } from '@progress/kendo-svg-icons';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { KENDO_CARD } from '@progress/kendo-angular-layout';
import { AsyncPipe } from '@angular/common';
import { AutoRefresherComponent } from '../auto-refresher/auto-refresher.component';
import { KENDO_DATEINPUT, KENDO_DATERANGE } from '@progress/kendo-angular-dateinputs';
import { KENDO_LABEL } from '@progress/kendo-angular-label';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { DashboardSearchFieldComponent } from './dashboard-search-field/dashboard-search-field.component';
import { DashboardShellStore } from '../shared/dashboard-shell.store';

interface IAffiliationFilter {
  filters?: AffiliationFilter | undefined;
  dateParameters?: DateParameters | undefined;
}

@Component({
  selector: 'portals-population-client',
  templateUrl: './population-client.component.html',
  styleUrls: ['./population-client.component.scss'],
  providers: [AdhesionActiveService, AdhesionSortanteService, PopulationClientService, DashboardShellStore],
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
    RouterOutlet,
  ],
})
export class PopulationClientComponent implements OnInit {
  public isExterne: boolean | undefined;

  constructor(
    private refClient: ReferentielClient,
    public populationClientService: PopulationClientService,
    public env: EnvironmentService,
    public router: Router,
    public ar: ActivatedRoute,
    private destroyRef: DestroyRef,
    public uiStore: DashboardShellStore
  ) {
    this.isExterne = this.env.isSouscripteurClient;
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

  onOutletLoaded(component: any, editMode = this.editModeSignal()) {
    this.component = component;
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
    return <UntypedFormControl>this.populationClientService.formFilter.get(name);
  }

  //#region Fields
  public souscripteurField: IFilterField = {
    placeholder: 'Souscripteurs',
    name: DashboardFields.Souscripteur,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getSouscripteursAffiliation(
        '1.0',
        GetSouscripteursAffiliationQuery.fromJS({ keyword: keyword?.toUpperCase() })
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
      this.refClient.getPolicesAffiliation(
        '1.0',
        GetPolicesAffiliationQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Police),
  };
  public statusField: IFilterField = {
    placeholder: 'Status',
    name: DashboardFields.Status,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) => this.refClient.getStatus('1.0', GetStatusQuery.fromJS({ keyword: keyword })),
    dependents: [],
    formField: (): UntypedFormControl => this.getField(DashboardFields.Status),
  };
  public numeroAdhesionField: IFilterField = {
    placeholder: 'Numéro Adhesion',
    name: DashboardFields.NumeroAdhesion,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getNumerosAdhesion(
        '1.0',
        GetNumerosAdhesionQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.NumeroAdhesion),
  };
  public anneeAdhesionField: IFilterField = {
    placeholder: 'Annee Adhesion',
    name: DashboardFields.AnneeAdhesion,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getAnneesAdhesion(
        '1.0',
        GetAnneesAdhesionQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.AnneeAdhesion),
  };
  public trimestreAdhesionField: IFilterField = {
    placeholder: 'Trimestre Adhesion',
    name: DashboardFields.TrimestreAdhesion,
    keyword: new Subject<string>(),
    data: [],
    isLoading: false,
    operation: (keyword) =>
      this.refClient.getTrimestresAdhesion(
        '1.0',
        GetTrimestresAdhesionQuery.fromJS({
          souscripteurs: this.souscripteurField.formField().value,
          keyword: keyword,
        })
      ),
    dependents: [this.souscripteurField],
    formField: (): UntypedFormControl => this.getField(DashboardFields.TrimestreAdhesion),
  };
  public fields: IFilterField[] = [
    this.souscripteurField,
    this.policeField,
    this.statusField,
    this.numeroAdhesionField,
    this.anneeAdhesionField,
    this.trimestreAdhesionField,
  ];

  //#endregion

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
    const today = dayjs().toDate();
    const lastYear = this.isExterne ? dayjs().set('month', 0).set('date', 1).toDate() : dayjs('2022-01-01').toDate();
    this.populationClientService.formFilter.reset({
      startingDate: lastYear,
      endDate: today,
      souscripteur: [],
      police: [],
      status: [],
      numeroAdhesion: [],
      anneeAdhesion: [],
      trimestreAdhesion: [],
    });
    RecomputeRelatedFields(this.fields);
  }

  search() {
    const filter = this.getFilter();
    this.populationClientService.affiliationFilters$.next(filter);
  }

  public getFilter(): IAffiliationFilter {
    return <IAffiliationFilter>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      anneeAdhesions: this.getField(DashboardFields.AnneeAdhesion).value,
      numeroAdhesions: this.getField(DashboardFields.NumeroAdhesion).value,
      polices: this.getField(DashboardFields.Police).value,
      status: this.getField(DashboardFields.Status).value,
      trimestreAdhesions: this.getField(DashboardFields.TrimestreAdhesion).value,
      dateParameters: <DateParameters>{
        startingDate: <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value!),
        endDate: <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value!),
      },
    };
  }

  navLinks = [
    {
      label: 'Résumé',
      link: './resume',
      index: 0,
    },
    {
      label: 'Population (âge)',
      link: './population-age',
      index: 1,
    },
    {
      label: 'Répartition (Type)',
      link: './repartition-type',
      index: 2,
    },
    {
      label: 'Adhésions actives',
      link: './adhesions-actives',
      index: 3,
    },
    {
      label: 'Adhésions sortantes',
      link: './adhesions-sortantes',
      index: 21,
    },
  ];
  handleDateChange = combineLatest([
    this.populationClientService.formFilter.controls['startingDate'].valueChanges,
    this.populationClientService.formFilter.controls['endDate'].valueChanges,
  ]).pipe(
    tap(() => {
      this.search();
    })
  );
  protected readonly filterIcon = filterIcon;
  protected readonly pencilIcon = pencilIcon;
  protected readonly arrowRotateCwIcon = arrowRotateCwIcon;
}
