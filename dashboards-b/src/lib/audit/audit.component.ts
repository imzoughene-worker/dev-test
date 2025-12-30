import { Component, DestroyRef, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { EnvironmentService, ITrigramme, toDateFormat, TRIGRAMME } from '@portals/base/core/core-component';
import {
  AuditFilter,
  DateParameters,
  GetSouscripteursSinistreQuery,
  ReferentielClient,
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
import { AuditService } from './services/audit.service';
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

interface IAuditFilter {
  filters?: AuditFilter | undefined;
  dateParameters?: DateParameters | undefined;
  modeRegleur?: boolean | undefined;
}

@Component({
  selector: 'portals-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  providers: [AuditService, DashboardShellStore],
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
export class AuditComponent implements OnInit {
  component: any | undefined;
  readonly filterOpen$ = this.uiStore.filterOpen$;
  readonly editMode$ = this.uiStore.editMode$;
  readonly editModeSignal = toSignal(this.editMode$, { initialValue: false });
  readonly modeRegleur = this.uiStore.modeRegleur;
  navLinks = [
    {
      label: 'Résumé',
      link: './resume',
      index: 22,
    },
  ];
  getTitle = this.router.events.pipe(
    startWith({ url: this.router.url }),
    filter((event: any) => event['url'] !== undefined),
    map((event) => {
      return this.navLinks.find((temp) => event.url.includes(temp.link.slice(2)))?.label;
    })
  );
  isExterne = false;

  constructor(
    private refClient: ReferentielClient,
    public auditService: AuditService,
    public router: Router,
    private en: EnvironmentService,
    private destroyRef: DestroyRef,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public uiStore: DashboardShellStore
  ) {
    this.isExterne = this.en.isSouscripteurClient;
  }

  handleDateChange = combineLatest([
    this.auditService.formFilter.controls['startingDate'].valueChanges,
    this.auditService.formFilter.controls['endDate'].valueChanges,
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
    return <UntypedFormControl>this.auditService.formFilter.get(name);
  }

  //#region Fields
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
  public fields: IFilterField[] = [this.souscripteurField];

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
    this.auditService.filterByNextcare.next(false);
    this.auditService.filterForToday.next(false);
    const today = dayjs().toDate();
    const lastYear = this.isExterne ? dayjs().set('month', 0).set('date', 1).toDate() : dayjs('2022-01-01').toDate();
    this.auditService.formFilter.reset({
      startingDate: lastYear,
      endDate: today,
      souscripteur: [],
    });
    this.uiStore.setModeRegleur(undefined);
    RecomputeRelatedFields(this.fields);
  }

  search() {
    const query = this.getFilter();
    this.auditService.auditFilters$.next(query);
  }

  public getFilter(): IAuditFilter {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value!);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value!);

    if (this.auditService.filterForToday.getValue()) {
      startDate = new Date();
      endDate = new Date();
    }
    return <IAuditFilter>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      filtreNC: this.trigramme.authority === 'AZM' ? this.auditService.filterByNextcare.getValue() : false,
      modeRegleur: this.modeRegleur(),
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
