# one-janitor
Your personal OpenNebula Janitor

It will connect to your hypervisors via SSH and to your ONE via ONE addon-nodejs. Checking for the following things:

* Check virsh output against ONE output, looking for rogue VMs.
* Check for activated LVM logical volumes on unneeded HVs, looking for rogue LVs. (if you use clvm it will show false positives)
* Check for logical volumes for non-existing VMs, looking for ghost LVs.
