export namespace Screenshots {

  export interface Filter {
    rules: string[];
    strategy: 'whitelist' | 'blacklist';
  }

  export enum Status {
    match,
    truth_was_not_tested,
    truth_does_not_exist,
    do_not_match,
  }

  export type RelativePath = string;
  export type AbsolutePath = string;
  export type Directory = string;

  export interface Screenshot {
    key: RelativePath;
    path: {
      truth?: AbsolutePath;
      current?: AbsolutePath;
      diff?: AbsolutePath;
    };
    status: Status;
  }
}
