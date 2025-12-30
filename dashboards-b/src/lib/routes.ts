import { Routes } from '@angular/router';
import { PopulationClientComponent } from './population-client/population-client.component';
import { SuiviArrivageLotComponent } from './suivi-arrivage-lot/suivi-arrivage-lot.component';
import { SuiviLotComponent } from './suivi-lot/suivi-lot.component';
import { SuiviSinistreComponent } from './suivi-sinistre/suivi-sinistre.component';
import { FirstTabComponent } from './population-client/tabs/first-tab/first-tab.component';
import { SecondTabComponent } from './population-client/tabs/second-tab/second-tab.component';
import { ThirdTabComponent } from './population-client/tabs/third-tab/third-tab.component';
import { FourthTabComponent } from './population-client/tabs/fourth-tab/fourth-tab.component';
import { FifthTabComponent } from './suivi-arrivage-lot/tabs/fifth-tab/fifth-tab.component';
import { SixthTabComponent } from './suivi-arrivage-lot/tabs/sixth-tab/sixth-tab.component';
import { SeventhTabComponent } from './suivi-lot/tabs/seventh-tab/seventh-tab.component';
import { HeightTabComponent } from './suivi-lot/tabs/height-tab/height-tab.component';
import { NinthTabComponent } from './suivi-sinistre/tabs/ninth-tab/ninth-tab.component';
import { TenthTabComponent } from './suivi-sinistre/tabs/tenth-tab/tenth-tab.component';
import { EleventhTabComponent } from './suivi-sinistre/tabs/eleventh-tab/eleventh-tab.component';
import { TwelfthTabComponent } from './suivi-sinistre/tabs/twelfth-tab/twelfth-tab.component';
import { ThirteenthTabComponent } from './suivi-sinistre/tabs/thirteenth-tab/thirteenth-tab.component';
import { NineteenthTabComponent } from './suivi-sinistre/tabs/nineteenth-tab/nineteenth-tab.component';
import { EighteenthTabComponent } from './suivi-sinistre/tabs/eighteenth-tab/eighteenth-tab.component';
import { SeventeenthTabComponent } from './suivi-sinistre/tabs/seventeenth-tab/seventeenth-tab.component';
import { SixteenthTabComponent } from './suivi-sinistre/tabs/sixteenth-tab/sixteenth-tab.component';
import { FifteenthTabComponent } from './suivi-sinistre/tabs/fifteenth-tab/fifteenth-tab.component';
import { FourteenthTabComponent } from './suivi-sinistre/tabs/fourteenth-tab/fourteenth-tab.component';
import { SuiviEncaissementCieComponent } from './suivi-encaissement-cie/suivi-encaissement-cie.component';
import { TwentyTwothTabComponent } from './population-client/tabs/twenty-twoth-tab/twenty-twoth-tab.component';
import { TwentythTabComponent } from './suivi-encaissement-cie/twentyth-tab/twentyth-tab.component';
import { TwentyonethTabComponent } from './suivi-encaissement-cie/twentyoneth-tab/twentyoneth-tab.component';
import { AuditComponent } from './audit/audit.component';
import { AdminComponent } from './admin/admin.component';
import { TwentythreethTabComponent } from './audit/tabs/twentythreeth-tab/twentythreeth-tab.component';
import { TwentyfourthTabComponent } from './admin/tabs/twentyfourth-tab/twentyfourth-tab.component';
import { TwentyfifthTabComponent } from './admin/tabs/twentyfifth-tab/twentyfifth-tab.component';
import { Etat18Component } from './etat-18/etat-18.component';
import { levelGuard } from '@portals/base/core/guards';

export const DashboardsRoutes: Routes = [
  {
    path: 'population-client',
    component: PopulationClientComponent,
    canActivate: [
      levelGuard([
        { identifier: 'PGD', level: 0 },
        { identifier: 'CDA', level: 2 },
        { identifier: 'PSD', level: 2 },
      ]),
    ],
    children: [
      {
        path: 'resume',
        component: FirstTabComponent,
        title: 'Population Clients - Résumé',
      },
      {
        path: 'population-age',
        component: SecondTabComponent,
        title: 'Population Clients - Population Âge',
      },
      {
        path: 'repartition-type',
        component: ThirdTabComponent,
        title: 'Population Clients - Repartition par Type',
      },
      {
        path: 'adhesions-actives',
        component: FourthTabComponent,
        title: 'Population Clients - Adhésions Actives',
      },
      {
        path: 'adhesions-sortantes',
        component: TwentyTwothTabComponent,
        title: 'Population Clients - Adhésions Sortantes',
      },
    ],
  },
  {
    path: 'suivi-arrivage-lot',
    component: SuiviArrivageLotComponent,
    canActivate: [
      levelGuard([
        { identifier: 'PGD', level: 0 },
        { identifier: 'CDA', level: 2 },
        { identifier: 'PSD', level: 2 },
      ]),
    ],
    children: [
      {
        path: 'dossiers',
        component: FifthTabComponent,
        title: 'Suivi Arrivage Lot - Dossiers',
      },
      {
        path: 'lots',
        component: SixthTabComponent,
        title: 'Suivi Arrivage Lot - Lots',
      },
    ],
  },
  {
    path: 'suivi-lot',
    canActivate: [
      levelGuard([
        { identifier: 'PGD', level: 0 },
        { identifier: 'CDA', level: 2 },
        { identifier: 'PSD', level: 2 },
      ]),
    ],
    component: SuiviLotComponent,
    children: [
      {
        path: 'liquidation-lot',
        component: SeventhTabComponent,
        title: 'Suivi Lot - Liquidation Lot',
      },
      {
        path: 'listing-dossiers',
        component: HeightTabComponent,
        title: 'Suivi Lot - Listing Dossiers',
      },
    ],
  },
  {
    path: 'suivi-sinistre',
    canActivate: [
      levelGuard([
        { identifier: 'PGD', level: 0 },
        { identifier: 'CDA', level: 2 },
        { identifier: 'PSD', level: 2 },

      ]),
    ],
    component: SuiviSinistreComponent,
    children: [
      {
        path: 'resume',
        component: NinthTabComponent,
        title: 'Suivi Sinistre - Résumé',
      },
      {
        path: 'remboursement-compagnie',
        component: TenthTabComponent,
        title: 'Suivi Sinistre - Remboursement Compagnie',
      },
      {
        path: 'type-dossiers',
        component: EleventhTabComponent,
        title: 'Suivi Sinistre - Type de Dossiers',
      },
      {
        path: 'prestataires-soins',
        component: TwelfthTabComponent,
        title: 'Suivi Sinistre - Prestataires des Soins',
      },
      {
        path: 'consommation-rubriques',
        component: ThirteenthTabComponent,
        title: 'Suivi Sinistre - Consommation par Rubriques',
      },
      {
        path: 'consommation-top10',
        component: FourteenthTabComponent,
        title: 'Suivi Sinistre - Top 10',
      },
      {
        path: 'suivi-dossiers',
        component: FifteenthTabComponent,
        title: 'Suivi Sinistre - Suivi des Dossiers',
      },
      {
        path: 'non-rembourse',
        component: SixteenthTabComponent,
        title: 'Suivi Sinistre - Non Remboursé',
      },
      {
        path: 'suivi-cv',
        component: SeventeenthTabComponent,
        title: 'Suivi Sinistre - Suivi CV',
      },
      {
        path: 'suivi-ap',
        component: EighteenthTabComponent,
        title: 'Suivi Sinistre - Suivi AP',
      },
      {
        path: 'suivi-pec',
        component: NineteenthTabComponent,
        title: 'Suivi Sinistre - Suivi PEC',
      },
    ],
  },
  {
    path: 'suivi-encaissement-cie',
    component: SuiviEncaissementCieComponent,
    canActivate: [
      levelGuard([
        { identifier: 'PGD', level: 0, isCompany: false },
        { identifier: 'CDA', level: 2, isCompany: false },
      ]),
    ],
    children: [
      {
        path: 'detail',
        component: TwentythTabComponent,
        title: 'Suivi Encaissement Cie - Détail',
      },
      {
        path: 'suivi',
        component: TwentyonethTabComponent,
        title: 'Suivi Encaissement Cie - Suivi',
      },
    ],
  },

  {
    path: 'etat-18',
    canActivate: [levelGuard([{ identifier: 'CDA', level: 2 }])],
    component: Etat18Component,
    title: 'État 18',
    data: {
      disableValidation: false,
    },
  },

  {
    path: 'admin-etat-18',
    canActivate: [levelGuard([{ identifier: 'AZT', level: 5 }])],
    component: Etat18Component,
    title: 'État 18',
    data: {
      disableValidation: true,
    },
  },

  {
    path: 'audit',
    component: AuditComponent,
    canActivate: [levelGuard([{ identifier: 'CDA', level: 2 }])],
    children: [
      {
        path: 'resume',
        component: TwentythreethTabComponent,
        title: 'Audit - Résumé',
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [levelGuard([{ identifier: 'CDA', level: 2 }])],
    component: AdminComponent,
    children: [
      {
        path: 'resume',
        component: TwentyfourthTabComponent,
        title: 'Admin - Résumé',
      },
      {
        path: 'suivi-agent',
        title: 'Admin - Suivi Agent',
        component: TwentyfifthTabComponent,
      },
    ],
  },
];
