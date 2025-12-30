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
import { DateLongPipe } from '@portals/base/core/pipes';
import { RoleEnum } from '@portals/client-identity';
import {
  DateParameters,
  ISuiviEncaissementCieFilters,
  SuiviEncaissementCieClient,
  SuiviEncaissementCieFilters,
} from '@portals/client-reporting';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { WindowService } from '@progress/kendo-angular-dialog';
import { DataStateChangeEvent, KENDO_GRID } from '@progress/kendo-angular-grid';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { KENDO_RIPPLE } from '@progress/kendo-angular-ripple';
import { fileExcelIcon } from '@progress/kendo-svg-icons';
import { BehaviorSubject, take } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DashboardFields } from '../../dashboard-model';
import { DetailSuiviEncaissementService } from '../services/detail-suivi-encaissement-cie.service';
import { SuiviEncaissementCieService } from '../services/suivi-encaissement-cie.service';

@Component({
  selector: 'portals-twentyoneth-tab',
  templateUrl: './twentyoneth-tab.component.html',
  styleUrls: ['./twentyoneth-tab.component.scss'],
  imports: [KENDO_TILELAYOUT, KENDO_RIPPLE, KENDO_BUTTON, KENDO_GRID, AsyncPipe, DateLongPipe],
})
export class TwentyonethTabComponent implements OnInit {
  hide: BehaviorSubject<boolean>[] = Array.from({ length: 1 }).map((x) => new BehaviorSubject<boolean>(false));
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
  constructor(
    public suiviEncaissementCieService: SuiviEncaissementCieService,
    public detailSuiviEncaissementService: DetailSuiviEncaissementService,
    public suiviEncaissementCieClient: SuiviEncaissementCieClient,
    @Inject(TRIGRAMME) protected trigramme: ITrigramme,
    private windowService: WindowService,
    private destroyRef: DestroyRef,
    private myUser: MyUserService,
    private roleService: RoleService
  ) {}

  editMode = false;

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
    return <UntypedFormControl>this.suiviEncaissementCieService.formFilter.get(name);
  }

  ngOnInit(): void {
    this.detailSuiviEncaissementService.reset();
    this.suiviEncaissementCieService.suiviEncaissementCieFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: ISuiviEncaissementCieFilters | null) => {
        if (queryObject == null) return;
        // variable non utilisée
        // let query = {
        //   filters: queryObject
        // };
        this.updateEncaissementCies(queryObject);
      });
  }

  //DEBUT GRILLE SUIVI ARRIVAGE LOT

  public raffrachirEncaissementCies(): void {
    this.detailSuiviEncaissementService.refresh(this.getFilter());
  }

  public dataStateChangeEncaissementCies(state: DataStateChangeEvent): void {
    this.detailSuiviEncaissementService.state = state;
    this.detailSuiviEncaissementService.read(this.getFilter());
  }

  updateEncaissementCies(query: ISuiviEncaissementCieFilters): void {
    this.detailSuiviEncaissementService.refresh(query);
  }

  isExporting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportDetailEncaissements(): void {
    const exportDetailEncaissement = SuiviEncaissementCieFilters.fromJS(this.getFilter());
    this.isExporting.next(true);
    this.suiviEncaissementCieClient
      .exportDetailEncaissement('1.0', exportDetailEncaissement)
      .pipe(
        take(1),
        finalize(() => this.isExporting.next(false))
      )
      .subscribe((s) => {
        s.fileName = s.fileName === undefined ? 'export' : s.fileName;
        exportSceneBlob(s);
      });
  }

  //FIN GRILLE SUIVI ARRIVGE LOT

  public getFilter(): ISuiviEncaissementCieFilters {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value);

    if (this.suiviEncaissementCieService.filterForToday.getValue()) {
      startDate = new Date();
      endDate = new Date();
    }
    return <ISuiviEncaissementCieFilters>{
      souscripteurs: this.getField(DashboardFields.Souscripteur).value,
      cies: this.getField(DashboardFields.Cie).value,
      status: this.getField(DashboardFields.Status).value,
      typeEncaissements: this.getField(DashboardFields.TypeEncaissement).value,
      numeroCVs: this.getField(DashboardFields.NumeroCV).value,
      filtreNC:
        this.trigramme.authority === 'AZM' ? this.suiviEncaissementCieService.filterByNextcare.getValue() : false,
      dateParameters: <DateParameters>{
        startingDate: startDate,
        endDate: endDate,
      },
    };
  }

  protected readonly fileExcelIcon = fileExcelIcon;
}
