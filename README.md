# one-janitor
Your personal OpenNebula Janitor

It will connect to your hypervisors via SSH and to OpenNebula via API using [addon-nodejs](https://github.com/OpenNebula/addon-nodejs) in order to check for the following things:

* Check virsh output against ONE output, looking for rogue VMs.
* Check for activated LVM logical volumes on unneeded HVs, looking for rogue LVs. (if you use clvm it will show false positives)
* Check for logical volumes for non-existing VMs, looking for ghost LVs.

## Usage

* npm install
* node main.js

## Notes

* Hypervisor list is automatically loaded from OpenNebula, hypervisors addresses my be overwritten using conf.js if needed. (different, unreachable network)
* SSH key is automatically loaded from the default path. (home/.ssh/id_rsa)
* SSH port by default is 22 but it may be specified using env variable JPORT
* Passphrase is asked on runtime
* OpenNebula API credentials are specified using the env variables ONE_CREDENTIALS and ONE_HOST
