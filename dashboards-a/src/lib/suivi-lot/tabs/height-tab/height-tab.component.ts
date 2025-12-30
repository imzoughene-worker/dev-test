import { AsyncPipe } from '@angular/common';
import { Component, computed, DestroyRef, Inject, OnInit, TemplateRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { UntypedFormControl } from '@angular/forms';
import {
  EnvironmentService,
  exportSceneBlob,
  ITrigramme,
  MyUserService,
  RoleService,
  toDateFormat,
  TRIGRAMME,
} from '@portals/base/core/core-component';
import { GridPersistanceDirective } from '@portals/base/core/directives';
import { DateLongPipe } from '@portals/base/core/pipes';
import { AppModeService } from '@portals/base/core/shared-services';
import { KeyValueComponent } from '@portals/base/shared/shared-component';
import { RoleEnum } from '@portals/client-identity';
import { DateParameters, ISuiviLotFilters, SuiviLotClient, SuiviLotFilters } from '@portals/client-reporting';
import { KENDO_BUTTON } from '@progress/kendo-angular-buttons';
import { WindowService } from '@progress/kendo-angular-dialog';
import { DataStateChangeEvent, KENDO_GRID } from '@progress/kendo-angular-grid';
import { KENDO_TILELAYOUT } from '@progress/kendo-angular-layout';
import { fileExcelIcon } from '@progress/kendo-svg-icons';
import { BehaviorSubject, take } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DashboardFields } from '../../../dashboard-model';
import { DetailDossierService } from '../../services/dossier.data.service';
import { SuiviLotService } from '../../services/suivi-lot.service';

@Component({
  selector: 'portals-height-tab',
  templateUrl: './height-tab.component.html',
  styleUrls: ['./height-tab.component.scss'],
  imports: [
    KENDO_TILELAYOUT,
    KENDO_BUTTON,
    KENDO_GRID,
    AsyncPipe,
    GridPersistanceDirective,
    DateLongPipe,
    KeyValueComponent,
  ],
})
export class HeightTabComponent implements OnInit {
  public isExterne: boolean | undefined;

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
    public suiviLotService: SuiviLotService,
    public detailLotService: DetailDossierService,
    public suiviLotClient: SuiviLotClient,
    private env: EnvironmentService,
    private windowService: WindowService,
    protected appModeService: AppModeService,
    private destroyRef: DestroyRef,
    @Inject(TRIGRAMME) private trigramme: ITrigramme,
    private myUser: MyUserService,
    private roleService: RoleService
  ) {
    this.isExterne = this.env.activePortalClient === 'portail-souscripteur' ? true : false;
  }

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
    return <UntypedFormControl>this.suiviLotService.formFilter.get(name);
  }

  ngOnInit(): void {
    this.detailLotService.reset();
    this.suiviLotService.suiviLotFilters$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((queryObject: ISuiviLotFilters | null) => {
        if (queryObject == null) return;
        // variable non utilisée
        // let query = {
        //   filters: queryObject
        // };
        this.updateSuiviLots(queryObject);
      });
  }

  //DEBUT GRILLE SUIVI ARRIVAGE LOT

  public raffrachirSuiviLots(): void {
    this.detailLotService.refresh(this.getFilter());
  }

  public dataStateChangeSuiviLots(state: DataStateChangeEvent): void {
    this.detailLotService.state = state;
    this.detailLotService.read(this.getFilter());
  }

  updateSuiviLots(query: ISuiviLotFilters): void {
    this.detailLotService.refresh(query);
  }

  isExporting: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  exportDetailDossiers(): void {
    const exportDetailDossiers = SuiviLotFilters.fromJS(this.getFilter());
    this.isExporting.next(true);
    this.suiviLotClient
      .exportDetailDossier(this.isExterne, '1.0', exportDetailDossiers)
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

  public getFilter(): ISuiviLotFilters {
    let startDate = <unknown>toDateFormat(this.getField(DashboardFields.StartingDate).value);
    let endDate = <unknown>toDateFormat(this.getField(DashboardFields.EndDate).value);

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

  protected readonly fileExcelIcon = fileExcelIcon;
}
