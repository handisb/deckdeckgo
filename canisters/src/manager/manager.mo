import BucketsStore "./buckets.store";
import CanisterTypes "../types/canister.types";
import CanisterUtils "../utils/canister.utils";
import Cycles "mo:base/ExperimentalCycles";
import DataBucket "../data/data";
import Error "mo:base/Error";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import StorageBucket "../storage/storage";
import Text "mo:base/Text";
import Types "../types/types";

actor Manager {
    type UserId = Types.UserId;

    type DataBucket = DataBucket.DataBucket;
    type StorageBucket = StorageBucket.StorageBucket;

    type BucketId = CanisterTypes.BucketId;

    private let canisterUtils: CanisterUtils.CanisterUtils = CanisterUtils.CanisterUtils();

    let dataStore: BucketsStore.BucketsStore<DataBucket> = BucketsStore.BucketsStore<DataBucket>();
    let storagesStore: BucketsStore.BucketsStore<StorageBucket> = BucketsStore.BucketsStore<StorageBucket>();

    // Preserve the application state on upgrades
    private stable var data : [(Principal, CanisterTypes.Bucket<DataBucket>)] = [];
    private stable var storages : [(Principal, CanisterTypes.Bucket<StorageBucket>)] = [];

    /**
     * Data
     */

    public shared({ caller }) func initData(): async (BucketId) {
        return await initBucket<DataBucket>(caller, dataStore, initNewDataBucket);
    };

    private func initNewDataBucket(manager: Principal, user: UserId, data: HashMap.HashMap<UserId, CanisterTypes.Bucket<DataBucket>>): async (Principal) {
        Cycles.add(1_000_000_000_000);
        let b: DataBucket = await DataBucket.DataBucket(user);

        let canisterId: Principal = Principal.fromActor(b);

        await canisterUtils.updateSettings(canisterId, manager);

        let newDataBucket: CanisterTypes.Bucket<DataBucket> = {
            bucket = b;
            bucketId = canisterId;
            owner = user;
        };

        data.put(user, newDataBucket);

        return canisterId;
    };

    public shared query({ caller }) func getData() : async ?BucketId {
        let result: {#bucketId: ?BucketId; #error: Text;} = dataStore.getBucket(caller);

        switch (result) {
            case (#error error) {
                throw Error.reject(error);
            };
            case (#bucketId bucketId) {
                switch (bucketId) {
                    case (?bucketId) {
                        return ?bucketId;
                    };
                    case null {
                        // We do not throw a "Not found error" here.
                        // For performance reason, in web app we first query if the bucket exists and then if not, we init it.
                        return null;
                    };
                };
            };
        };
    };

    public shared({ caller }) func delData() : async (Bool) {
        return await delBucket<DataBucket>(caller, dataStore);
    };

    // TODO: do we need inter-canister call or do we solves this in another way?
    // TODO: inter-canister call secure caller === user canister or this canister

    public func deleteDataAdmin(user: Principal) : async (Bool) {
        return await delBucket<DataBucket>(user, dataStore);
    };

    /**
     * Storages
     */

    public shared({ caller }) func initStorage(): async (BucketId) {
        return await initBucket<StorageBucket>(caller, storagesStore, initNewStorageBucket);
    };

    private func initNewStorageBucket(manager: Principal, user: UserId, storages: HashMap.HashMap<UserId, CanisterTypes.Bucket<StorageBucket>>): async (Principal) {
        Cycles.add(1_000_000_000_000);
        let b: StorageBucket = await StorageBucket.StorageBucket(user);

        let canisterId: Principal = Principal.fromActor(b);

        await canisterUtils.updateSettings(canisterId, manager);

        let newStorageBucket: CanisterTypes.Bucket<StorageBucket> = {
            bucket = b;
            bucketId = canisterId;
            owner = user;
        };

        storages.put(user, newStorageBucket);

        return canisterId;
    };

    public shared query({ caller }) func getStorage() : async ?BucketId {
        let result: {#bucketId: ?BucketId; #error: Text;} = storagesStore.getBucket(caller);

        switch (result) {
            case (#error error) {
                throw Error.reject(error);
            };
            case (#bucketId bucketId) {
                switch (bucketId) {
                    case (?bucketId) {
                        return ?bucketId;
                    };
                    case null {
                        // We do not throw a "Not found error" here.
                        // For performance reason, in web app we first query if the bucket exists and then if not, we init it.
                        return null;
                    };
                };
            };
        };
    };

    public shared({ caller }) func delStorage() : async (Bool) {
        return await delBucket<StorageBucket>(caller, storagesStore);
    };

    // TODO: do we need inter-canister call or do we solves this in another way?
    // TODO: inter-canister call secure caller === user canister or this canister

    public func deleteStorageAdmin(user: Principal) : async (Bool) {
        return await delBucket<StorageBucket>(user, storagesStore);
    };

    /**
     * Buckets
     */

    private func initBucket<T>(caller: Principal, store: BucketsStore.BucketsStore<T>, initNewBucket: (manager: Principal, user: UserId, buckets: HashMap.HashMap<UserId, CanisterTypes.Bucket<T>>) -> async (Principal)): async (BucketId) {
        let self: Principal = Principal.fromActor(Manager);

        let result: {#bucketId: BucketId; #error: Text;} = await store.init(self, caller, initNewBucket);

        switch (result) {
            case (#error error) {
                throw Error.reject(error);
            };
            case (#bucketId bucketId) {
                return bucketId;
            };
        };
    };

    private func delBucket<T>(caller: Principal, store: BucketsStore.BucketsStore<T>) : async (Bool) {
        let result: {#bucketId: ?BucketId; #error: Text;} = await store.deleteBucket(caller);

        switch (result) {
            case (#error error) {
                throw Error.reject(error);
            };
            case (#bucketId bucketId) {
                let exists: Bool = Option.isSome(bucketId);
                return exists;
            };
        };
    };

    /**
     * Admin
     */

    // TODO: protect caller = david
    public shared query({ caller }) func list(store: Text) : async [{bucketId: BucketId; owner: UserId;}] {
        if (Text.equal(store, "data")) {
            return dataStore.entries();
        };

        if (Text.equal(store, "storage")) {
            return storagesStore.entries();
        };

        throw Error.reject("Type of store not supported");
    };

    // TODO: protect caller = david
    public shared({ caller }) func installCode(canisterId: Principal, owner: UserId, wasmModule: Blob): async() {
        await canisterUtils.installCode(canisterId, owner, wasmModule);
    };

    /**
     * Stable memory for upgrade
     */

    system func preupgrade() {
        data := Iter.toArray(dataStore.preupgrade().entries());
        storages := Iter.toArray(storagesStore.preupgrade().entries());
    };

    system func postupgrade() {
        dataStore.postupgrade(data);
        data := [];

        storagesStore.postupgrade(storages);
        storages := [];
    };
}
