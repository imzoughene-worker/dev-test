import { UntypedFormControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';

export const DashboardSettings = {
  DebounceTime: 400,
} as const;

export const DashboardFields = {
  Souscripteur: 'souscripteur',
  Police: 'police',
  Status: 'status',
  NumeroAdhesion: 'numeroAdhesion',
  AnneeAdhesion: 'anneeAdhesion',
  TrimestreAdhesion: 'trimestreAdhesion',
  NumeroLot: 'numeroLot',
  NumeroDeclaration: 'numeroDeclaration',
  Adherent: 'adherent',
  Etat: 'etat',
  EtatClient: 'etatClient',
  EtatLot: 'etatLot',
  Cie: 'cie',
  NumeroCV: 'numeroCV',
  TypeEncaissement: 'typeEncaissement',
  TypeRetour: 'typeRetour',
  ThirdTag: 'thirdTag',
  Ecart: 'ecart',
  TotalSaisie: 'totalSaisie',
  StartingDate: 'startingDate',
  EndDate: 'endDate',
};

export interface IFilterField {
  placeholder: string;
  name: string;
  keyword: Subject<string>;
  isLoading: boolean;
  data: string[];
  operation: (keyword: string) => Observable<string[]>;
  onChanged?: () => void;
  dependents: IFilterField[];
  formField: () => UntypedFormControl;
}

export function RecomputeRelatedFields(fields: IFilterField[]) {
  for (let i = 0; i < fields.length; i++) {
    let field = fields[i];
    let fieldFc: UntypedFormControl = field.formField();
    let dependents = field.dependents;
    //si aucun field dependant et qu'il est desactivé , alors il faut le reactiver
    if (dependents.length == 0 && fieldFc.disabled) fieldFc.enable();
    else if (dependents.length > 0) {
      let allDependentsAreFilled = dependents
        .map((m) => m.formField().value)
        .every((o) => o != null && o != '' && o.length > 0);
      if (allDependentsAreFilled) {
        if (fieldFc.disabled) fieldFc.enable();
        field.keyword.next(''); //trigger change
      } else if (allDependentsAreFilled == false) {
        fieldFc.setValue([]);
        fieldFc.disable();
      }
    }
  }
}
