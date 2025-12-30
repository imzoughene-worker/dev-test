import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { Router, RouterOutlet } from '@angular/router';
import { ITrigramme, toDateFormat, TRIGRAMME } from '@portals/base/core/core-component';
import {
  AdminFilter,
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
  takeUntil,
  tap,
} from 'rxjs';
import { DashboardFields, DashboardSettings, IFilterField, RecomputeRelatedFields } from '../dashboard-model';
import { AdminService } from './services/admin.service';
import { SuiviAgentService } from './services/suivi-agent.data.service';
import dayjs from 'dayjs';
import { arrowRotateCwIcon, filterIcon, infoCircleIcon, pencilIcon } from '@progress/kendo-svg-icons';
import { KENDO_CARD } from '@progress/kendo-angular-layout';
import { AsyncPipe } from '@angular/common';
import { AutoRefresherComponent } from '../auto-refresher/auto-refresher.component';
import { KENDO_DATEINPUT, KENDO_DATERANGE } from '@progress/kendo-angular-dateinputs';
import { KENDO_LABEL } from '@progress/kendo-angular-label';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { DashboardSearchFieldComponent } from '../population-client/dashboard-search-field/dashboard-search-field.component';
import { KENDO_SWITCH } from '@progress/kendo-angular-inputs';
import { KENDO_SVGICON } from '@progress/kendo-angular-icons';
import { KENDO_TOOLTIP } from '@progress/kendo-angular-tooltip';
import { DashboardShellStore } from '../shared/dashboard-shell.store';
import { toSignal } from '@angular/core/rxjs-interop';

interface IAdminFilter {
  filters?: AdminFilter | undefined;
  dateParameters?: DateParameters | undefined;
}

@Component({
  selector: 'portals-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  providers: [AdminService, SuiviAgentService, DashboardShellStore],
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
    KENDO_SVGICON,
    KENDO_TOOLTIP,
  ],
})
export class AdminComponent implements OnInit, OnDestroy {
  destroy$: Subject<boolean> = new Subject<boolean>();
  component: any | undefined;
  readonly filterOpen$ = this.uiStore.filterOpen$;
  readonly editMode$ = this.uiStore.editMode$;
  readonly editModeSignal = toSignal(this.editMode$, { initialValue: false });

  constructor(
    private refClient: ReferentielClient,
    public adminService: AdminService,
    public router: Router,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public uiStore: DashboardShellStore
  ) {}

  navLinks = [
    {
      label: 'Résumé',
      link: './resume',
      index: 23,
    },
    {
      label: 'Suivi Agent',
      link: './suivi-agent',
      index: 24,
    },
  ];
  handleDateChange = combineLatest([
    this.adminService.formFilter.controls['startingDate'].valueChanges,
    this.adminService.formFilter.controls['endDate'].valueChanges,
  ]).pipe(
    tap(() => {
      this.search();
    })
  );

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
  getTitle = this.router.events.pipe(
    startWith({ url: this.router.url }),
    filter((event: any) => event['url'] !== undefined),
    map((event) => {
      return this.navLinks.find((temp) => event.url.includes(temp.link.slice(2)))?.label;
    })
  );

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.adminService.formFilter.get(name);
  }

  //#region Fields

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
            take(1),
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
    this.adminService.filterByNextcare.next(false);
    this.adminService.filterForToday.next(false);
    const today = dayjs().toDate();
    const lastYear = dayjs('2022-01-01').toDate();
    this.adminService.formFilter.reset({
      startingDate: lastYear,
      endDate: today,
      souscripteur: [],
    });
    RecomputeRelatedFields(this.fields);
  }

  search() {
    const query = this.getFilter();
    this.adminService.adminFilters$.next(query);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  public getFilter(): IAdminFilter {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value!);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value!);

    if (this.adminService.filterForToday.getValue()) {
      startDate = new Date();
      endDate = new Date();
    }
    return <IAdminFilter>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      filtreNC: this.trigramme.authority === 'AZM' ? this.adminService.filterByNextcare.getValue() : false,
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
