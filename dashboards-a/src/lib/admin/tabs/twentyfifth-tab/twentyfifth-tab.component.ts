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
import { AdminClient, AdminFilter, DateParameters, IAdminFilter } from '@portals/client-reporting';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { WindowService } from '@progress/kendo-angular-dialog';
import { DataStateChangeEvent, KENDO_GRID } from '@progress/kendo-angular-grid';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { KENDO_RIPPLE } from '@progress/kendo-angular-ripple';
import { fileExcelIcon } from '@progress/kendo-svg-icons';
import { BehaviorSubject, take } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DashboardFields } from '../../../dashboard-model';
import { AdminService } from '../../services/admin.service';
import { SuiviAgentService } from '../../services/suivi-agent.data.service';

@Component({
  selector: 'portals-twentyfifth-tab',
  templateUrl: './twentyfifth-tab.component.html',
  imports: [
    KENDO_TILELAYOUT,
    KENDO_RIPPLE,
    KENDO_BUTTON,
    KENDO_GRID,
    AsyncPipe,
    GridPersistanceDirective,
    DateLongPipe,
  ],
})
export class TwentyfifthTabComponent implements OnInit {
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 1 }).map((x) => new BehaviorSubject<boolean>(false));

  constructor(
    private adminClient: AdminClient,
    public suiviAgentService: SuiviAgentService,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    public adminService: AdminService,
    private destroyRef: DestroyRef,
    public windowService: WindowService,
    private myUser: MyUserService,
    private roleService: RoleService
  ) {}

  editMode = false;

  PGD = toSignal(this.myUser.hasLevel('PGD', 2));
  CDA = toSignal(this.myUser.hasLevel('CDA', 2));

  hasAccess = computed(() => {
    switch (this.roleService.currentRole()) {
      case RoleEnum.Intranet:
        return this.CDA();
      case RoleEnum.Gestionnaire:
        return this.PGD();
      default:
        return false;
    }
  });

  public getField(name: string): UntypedFormControl {
    return <UntypedFormControl>this.adminService.formFilter.get(name);
  }

  ngOnInit(): void {
    this.suiviAgentService.reset();
    this.adminService.adminFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: IAdminFilter | null) => {
        if (queryObject == null) return;
        this.updateSuiviAgent(queryObject);
      });
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

  public dataStateChangeSuiviAgent(state: DataStateChangeEvent): void {
    this.suiviAgentService.state = state;
    this.suiviAgentService.read(this.getFilter());
  }

  updateSuiviAgent(query: IAdminFilter): void {
    this.suiviAgentService.refresh(query);
  }

  isExporting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportSuiviAgent(): void {
    const exportSuiviAgent = AdminFilter.fromJS(this.getFilter());
    this.isExporting.next(true);
    this.adminClient
      .exportDetailsDossierSaisiParAgent('1.0', exportSuiviAgent)
      .pipe(
        take(1),
        finalize(() => this.isExporting.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  public getFilter(): IAdminFilter {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value);

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

  protected readonly fileExcelIcon = fileExcelIcon;
}
