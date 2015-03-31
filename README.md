# one-janitor
Your personal OpenNebula Janitor

It will connect to your hypervisors via SSH and to your ONE via ONE addon-nodejs. Checking for the following things:

* Check virsh output against ONE output, looking for rogue VMS.
* Check for activated LVM volumes on unneeded HVs, looking for rogue LVs.
