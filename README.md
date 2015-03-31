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
* It's a nice boilerplate if you need to interact with an OpenNebula setup globally and using multiple protocols.

## License

Licensed under the Apache license, version 2.0 (the "license"); You may not use this file except in compliance with the license. You may obtain a copy of the license at:

    http://www.apache.org/licenses/LICENSE-2.0.html

Unless required by applicable law or agreed to in writing, software distributed under the license is distributed on an "as is" basis, without warranties or conditions of any kind, either express or implied. See the license for the specific language governing permissions and limitations under the license.
